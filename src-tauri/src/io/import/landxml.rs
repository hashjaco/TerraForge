use crate::engine::Point3;

/// Import surface data from a LandXML file.
/// Parses <Surface> elements containing <Pnts> and <Faces>.
pub fn import_landxml(content: &str) -> Result<LandXmlData, String> {
    let mut data = LandXmlData {
        points: Vec::new(),
        faces: Vec::new(),
        alignments: Vec::new(),
        surface_name: String::new(),
    };

    // Simple XML parsing for LandXML format
    let mut in_surface = false;
    let mut in_pnts = false;
    let mut in_faces = false;
    let mut in_alignment = false;
    let mut current_alignment = LandXmlAlignment {
        name: String::new(),
        points: Vec::new(),
    };

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.contains("<Surface") {
            in_surface = true;
            if let Some(name) = extract_attribute(trimmed, "name") {
                data.surface_name = name;
            }
        } else if trimmed.contains("</Surface") {
            in_surface = false;
        } else if trimmed.contains("<Pnts") {
            in_pnts = true;
        } else if trimmed.contains("</Pnts") {
            in_pnts = false;
        } else if trimmed.contains("<Faces") {
            in_faces = true;
        } else if trimmed.contains("</Faces") {
            in_faces = false;
        } else if trimmed.contains("<Alignment") {
            in_alignment = true;
            current_alignment.name = extract_attribute(trimmed, "name").unwrap_or_default();
            current_alignment.points.clear();
        } else if trimmed.contains("</Alignment") {
            if !current_alignment.points.is_empty() {
                data.alignments.push(current_alignment.clone());
            }
            in_alignment = false;
        }

        // Parse point: <P id="1">northing easting elevation</P>
        if in_pnts && trimmed.starts_with("<P") {
            if let Some(coords) = extract_element_content(trimmed, "P") {
                let parts: Vec<&str> = coords.split_whitespace().collect();
                if parts.len() >= 3 {
                    let y: f64 = parts[0].parse().unwrap_or(0.0); // northing
                    let x: f64 = parts[1].parse().unwrap_or(0.0); // easting
                    let z: f64 = parts[2].parse().unwrap_or(0.0); // elevation
                    data.points.push(Point3::new(x, y, z));
                }
            }
        }

        // Parse face: <F>p1 p2 p3</F>
        if in_faces && trimmed.starts_with("<F") {
            if let Some(indices) = extract_element_content(trimmed, "F") {
                let parts: Vec<&str> = indices.split_whitespace().collect();
                if parts.len() >= 3 {
                    let i0: u32 = parts[0].parse().unwrap_or(1) - 1; // 1-based to 0-based
                    let i1: u32 = parts[1].parse().unwrap_or(1) - 1;
                    let i2: u32 = parts[2].parse().unwrap_or(1) - 1;
                    data.faces.push([i0, i1, i2]);
                }
            }
        }

        // Parse coordinate geometry points for alignments
        if in_alignment && (trimmed.contains("<CoordGeom") || trimmed.contains("<Start")
            || trimmed.contains("<End") || trimmed.contains("<PI"))
        {
            if let Some(coords) = extract_element_content(trimmed, "Start")
                .or_else(|| extract_element_content(trimmed, "End"))
                .or_else(|| extract_element_content(trimmed, "PI"))
            {
                let parts: Vec<&str> = coords.split_whitespace().collect();
                if parts.len() >= 2 {
                    let y: f64 = parts[0].parse().unwrap_or(0.0);
                    let x: f64 = parts[1].parse().unwrap_or(0.0);
                    let z: f64 = if parts.len() >= 3 { parts[2].parse().unwrap_or(0.0) } else { 0.0 };
                    current_alignment.points.push(Point3::new(x, y, z));
                }
            }
        }
    }

    if data.points.is_empty() && data.alignments.is_empty() {
        return Err("No data found in LandXML file".into());
    }

    Ok(data)
}

/// Export surface and alignment data to LandXML format.
pub fn export_landxml(
    project_name: &str,
    surface_name: &str,
    points: &[Point3],
    triangles: &[[u32; 3]],
    alignments: &[(String, Vec<Point3>)],
) -> String {
    let mut xml = String::new();
    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str(&format!(
        "<LandXML xmlns=\"http://www.landxml.org/schema/LandXML-1.2\" version=\"1.2\">\n"
    ));
    xml.push_str(&format!("  <Project name=\"{}\"/>\n", project_name));

    // Surface
    if !points.is_empty() {
        xml.push_str("  <Surfaces>\n");
        xml.push_str(&format!("    <Surface name=\"{}\">\n", surface_name));
        xml.push_str("      <Definition surfType=\"TIN\">\n");

        xml.push_str("        <Pnts>\n");
        for (i, p) in points.iter().enumerate() {
            xml.push_str(&format!(
                "          <P id=\"{}\">{:.6} {:.6} {:.6}</P>\n",
                i + 1, p.y, p.x, p.z
            ));
        }
        xml.push_str("        </Pnts>\n");

        xml.push_str("        <Faces>\n");
        for tri in triangles {
            xml.push_str(&format!(
                "          <F>{} {} {}</F>\n",
                tri[0] + 1, tri[1] + 1, tri[2] + 1
            ));
        }
        xml.push_str("        </Faces>\n");

        xml.push_str("      </Definition>\n");
        xml.push_str("    </Surface>\n");
        xml.push_str("  </Surfaces>\n");
    }

    // Alignments
    if !alignments.is_empty() {
        xml.push_str("  <Alignments>\n");
        for (name, pts) in alignments {
            xml.push_str(&format!("    <Alignment name=\"{}\">\n", name));
            xml.push_str("      <CoordGeom>\n");
            for window in pts.windows(2) {
                xml.push_str(&format!(
                    "        <Line>\n          <Start>{:.6} {:.6}</Start>\n          <End>{:.6} {:.6}</End>\n        </Line>\n",
                    window[0].y, window[0].x, window[1].y, window[1].x
                ));
            }
            xml.push_str("      </CoordGeom>\n");
            xml.push_str("    </Alignment>\n");
        }
        xml.push_str("  </Alignments>\n");
    }

    xml.push_str("</LandXML>\n");
    xml
}

#[derive(Debug, Clone)]
pub struct LandXmlData {
    pub points: Vec<Point3>,
    pub faces: Vec<[u32; 3]>,
    pub alignments: Vec<LandXmlAlignment>,
    pub surface_name: String,
}

#[derive(Debug, Clone)]
pub struct LandXmlAlignment {
    pub name: String,
    pub points: Vec<Point3>,
}

fn extract_attribute(line: &str, attr: &str) -> Option<String> {
    let pattern = format!("{}=\"", attr);
    if let Some(start) = line.find(&pattern) {
        let rest = &line[start + pattern.len()..];
        if let Some(end) = rest.find('"') {
            return Some(rest[..end].to_string());
        }
    }
    None
}

fn extract_element_content(line: &str, tag: &str) -> Option<String> {
    let open = format!("<{}", tag);
    let close = format!("</{}>", tag);
    if let Some(start) = line.find(&open) {
        let after_open = &line[start..];
        if let Some(gt) = after_open.find('>') {
            let content_start = start + gt + 1;
            if let Some(close_pos) = line.find(&close) {
                if close_pos > content_start {
                    return Some(line[content_start..close_pos].to_string());
                }
            }
        }
    }
    None
}
