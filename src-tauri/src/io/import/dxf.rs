use crate::engine::Point3;

/// Import points from a DXF file.
/// Extracts POINT entities, 3DFACE entities (as triangle vertices),
/// and POLYLINE/LWPOLYLINE vertices.
pub fn import_dxf(content: &str) -> Result<Vec<Point3>, String> {
    let mut points = Vec::new();
    let lines: Vec<&str> = content.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let code = lines[i].trim();

        // Look for POINT entities
        if code == "0" && i + 1 < lines.len() && lines[i + 1].trim() == "POINT" {
            let mut x = 0.0_f64;
            let mut y = 0.0_f64;
            let mut z = 0.0_f64;
            let mut j = i + 2;
            while j + 1 < lines.len() {
                let gc = lines[j].trim();
                let val = lines[j + 1].trim();
                match gc {
                    "10" => x = val.parse().unwrap_or(0.0),
                    "20" => y = val.parse().unwrap_or(0.0),
                    "30" => z = val.parse().unwrap_or(0.0),
                    "0" => break,
                    _ => {}
                }
                j += 2;
            }
            points.push(Point3::new(x, y, z));
            i = j;
            continue;
        }

        // Look for 3DFACE entities
        if code == "0" && i + 1 < lines.len() && lines[i + 1].trim() == "3DFACE" {
            let _face_pts: Vec<Point3> = Vec::new();
            let mut coords: [(f64, f64, f64); 4] = [(0.0, 0.0, 0.0); 4];
            let mut j = i + 2;
            while j + 1 < lines.len() {
                let gc = lines[j].trim();
                let val = lines[j + 1].trim();
                match gc {
                    "10" => coords[0].0 = val.parse().unwrap_or(0.0),
                    "20" => coords[0].1 = val.parse().unwrap_or(0.0),
                    "30" => coords[0].2 = val.parse().unwrap_or(0.0),
                    "11" => coords[1].0 = val.parse().unwrap_or(0.0),
                    "21" => coords[1].1 = val.parse().unwrap_or(0.0),
                    "31" => coords[1].2 = val.parse().unwrap_or(0.0),
                    "12" => coords[2].0 = val.parse().unwrap_or(0.0),
                    "22" => coords[2].1 = val.parse().unwrap_or(0.0),
                    "32" => coords[2].2 = val.parse().unwrap_or(0.0),
                    "13" => coords[3].0 = val.parse().unwrap_or(0.0),
                    "23" => coords[3].1 = val.parse().unwrap_or(0.0),
                    "33" => coords[3].2 = val.parse().unwrap_or(0.0),
                    "0" => break,
                    _ => {}
                }
                j += 2;
            }
            for (cx, cy, cz) in &coords {
                let p = Point3::new(*cx, *cy, *cz);
                if !points.iter().any(|existing| existing.distance_to(&p) < 1e-6) {
                    points.push(p);
                }
            }
            i = j;
            continue;
        }

        // Look for LINE entities
        if code == "0" && i + 1 < lines.len() && lines[i + 1].trim() == "LINE" {
            let mut x1 = 0.0_f64;
            let mut y1 = 0.0_f64;
            let mut z1 = 0.0_f64;
            let mut x2 = 0.0_f64;
            let mut y2 = 0.0_f64;
            let mut z2 = 0.0_f64;
            let mut j = i + 2;
            while j + 1 < lines.len() {
                let gc = lines[j].trim();
                let val = lines[j + 1].trim();
                match gc {
                    "10" => x1 = val.parse().unwrap_or(0.0),
                    "20" => y1 = val.parse().unwrap_or(0.0),
                    "30" => z1 = val.parse().unwrap_or(0.0),
                    "11" => x2 = val.parse().unwrap_or(0.0),
                    "21" => y2 = val.parse().unwrap_or(0.0),
                    "31" => z2 = val.parse().unwrap_or(0.0),
                    "0" => break,
                    _ => {}
                }
                j += 2;
            }
            let p1 = Point3::new(x1, y1, z1);
            let p2 = Point3::new(x2, y2, z2);
            if !points.iter().any(|e| e.distance_to(&p1) < 1e-6) {
                points.push(p1);
            }
            if !points.iter().any(|e| e.distance_to(&p2) < 1e-6) {
                points.push(p2);
            }
            i = j;
            continue;
        }

        i += 1;
    }

    if points.is_empty() {
        Err("No point data found in DXF file".into())
    } else {
        Ok(points)
    }
}

/// Export surface data to DXF format.
pub fn export_dxf(
    points: &[Point3],
    triangles: &[[u32; 3]],
    polylines: &[Vec<Point3>],
) -> String {
    let mut dxf = String::new();

    // Header
    dxf.push_str("0\nSECTION\n2\nHEADER\n");
    dxf.push_str("9\n$ACADVER\n1\nAC1027\n");
    dxf.push_str("0\nENDSEC\n");

    // Entities section
    dxf.push_str("0\nSECTION\n2\nENTITIES\n");

    // Write points
    for p in points {
        dxf.push_str(&format!(
            "0\nPOINT\n8\n0\n10\n{:.6}\n20\n{:.6}\n30\n{:.6}\n",
            p.x, p.y, p.z
        ));
    }

    // Write triangles as 3DFACE
    for tri in triangles {
        let p0 = &points[tri[0] as usize];
        let p1 = &points[tri[1] as usize];
        let p2 = &points[tri[2] as usize];
        dxf.push_str(&format!(
            "0\n3DFACE\n8\nSURFACE\n\
             10\n{:.6}\n20\n{:.6}\n30\n{:.6}\n\
             11\n{:.6}\n21\n{:.6}\n31\n{:.6}\n\
             12\n{:.6}\n22\n{:.6}\n32\n{:.6}\n\
             13\n{:.6}\n23\n{:.6}\n33\n{:.6}\n",
            p0.x, p0.y, p0.z,
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.z,
            p2.x, p2.y, p2.z,
        ));
    }

    // Write polylines
    for polyline in polylines {
        if polyline.is_empty() {
            continue;
        }
        dxf.push_str("0\nPOLYLINE\n8\nALIGNMENT\n66\n1\n70\n8\n");
        for p in polyline {
            dxf.push_str(&format!(
                "0\nVERTEX\n8\nALIGNMENT\n10\n{:.6}\n20\n{:.6}\n30\n{:.6}\n70\n32\n",
                p.x, p.y, p.z
            ));
        }
        dxf.push_str("0\nSEQEND\n");
    }

    dxf.push_str("0\nENDSEC\n0\nEOF\n");
    dxf
}
