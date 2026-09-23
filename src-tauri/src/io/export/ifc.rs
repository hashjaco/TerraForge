use crate::engine::surface::Surface;
use crate::engine::alignment::Alignment;

/// Export infrastructure model to IFC 4.3 STEP format.
/// This generates a simplified IFC file for BIM collaboration.
pub fn export_ifc(
    project_name: &str,
    surfaces: &[&Surface],
    alignments: &[&Alignment],
) -> String {
    let mut ifc = String::new();

    // IFC STEP header
    ifc.push_str("ISO-10303-21;\n");
    ifc.push_str("HEADER;\n");
    ifc.push_str("FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');\n");
    ifc.push_str(&format!(
        "FILE_NAME('{}','2026-01-01T00:00:00',('TerraForge'),(''),\
         'TerraForge','TerraForge','');\n",
        project_name
    ));
    ifc.push_str("FILE_SCHEMA(('IFC4X3'));\n");
    ifc.push_str("ENDSEC;\n\n");
    ifc.push_str("DATA;\n");

    let mut entity_id = 1u64;

    // Project
    let _project_id = entity_id;
    ifc.push_str(&format!(
        "#{}=IFCPROJECT('{}',#{},'{}','',$,$,$,$,$);\n",
        entity_id,
        generate_ifc_guid(),
        entity_id + 1,
        project_name
    ));
    entity_id += 1;

    // Owner history (simplified)
    let owner_id = entity_id;
    ifc.push_str(&format!(
        "#{}=IFCOWNERHISTORY(#{},$,.READWRITE.,$,$,$,$,0);\n",
        entity_id, entity_id + 1
    ));
    entity_id += 1;

    // Person and organization
    ifc.push_str(&format!(
        "#{}=IFCPERSONANDORGANIZATION(#{},#{},$);\n",
        entity_id, entity_id + 1, entity_id + 2
    ));
    entity_id += 1;
    ifc.push_str(&format!("#{}=IFCPERSON($,'','TerraForge User',$,$,$,$,$);\n", entity_id));
    entity_id += 1;
    ifc.push_str(&format!("#{}=IFCORGANIZATION($,'TerraForge',$,$,$);\n", entity_id));
    entity_id += 1;

    // Site
    let _site_id = entity_id;
    ifc.push_str(&format!(
        "#{}=IFCSITE('{}',#{},'Site',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);\n",
        entity_id,
        generate_ifc_guid(),
        owner_id
    ));
    entity_id += 1;

    // Export surfaces as IfcGeographicElement
    for surface in surfaces {
        ifc.push_str(&format!(
            "#{}=IFCGEOGRAPHICELEMENT('{}',#{},'{}','{}',$,$,$,$,.TERRAIN.);\n",
            entity_id,
            generate_ifc_guid(),
            owner_id,
            surface.name,
            surface.name,
        ));
        entity_id += 1;

        // Triangulated face set
        let points_id = entity_id;
        let mut coords = String::new();
        for p in &surface.points {
            if !coords.is_empty() {
                coords.push(',');
            }
            coords.push_str(&format!("({:.4},{:.4},{:.4})", p.x, p.y, p.z));
        }
        ifc.push_str(&format!(
            "#{}=IFCCARTESIANPOINTLIST3D(({}));\n",
            entity_id, coords
        ));
        entity_id += 1;

        let mut indices = String::new();
        for tri in &surface.triangles {
            if !indices.is_empty() {
                indices.push(',');
            }
            indices.push_str(&format!("({},{},{})", tri[0] + 1, tri[1] + 1, tri[2] + 1));
        }
        ifc.push_str(&format!(
            "#{}=IFCTRIANGULATEDFACESET(#{},{},$,({}),());\n",
            entity_id, points_id, "$", indices
        ));
        entity_id += 1;
    }

    // Export alignments as IfcAlignment
    for alignment in alignments {
        ifc.push_str(&format!(
            "#{}=IFCALIGNMENT('{}',#{},'{}','{}',$,$,$,$);\n",
            entity_id,
            generate_ifc_guid(),
            owner_id,
            alignment.name,
            alignment.name,
        ));
        entity_id += 1;
    }

    ifc.push_str("ENDSEC;\n");
    ifc.push_str("END-ISO-10303-21;\n");

    ifc
}

fn generate_ifc_guid() -> String {
    let uuid = uuid::Uuid::new_v4();
    let bytes = uuid.as_bytes();
    let mut result = String::with_capacity(22);
    let chars = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

    for i in 0..22 {
        let byte_idx = (i * 6) / 8;
        let bit_offset = (i * 6) % 8;
        let val = if byte_idx + 1 < bytes.len() {
            ((bytes[byte_idx] as u16) << 8 | bytes[byte_idx + 1] as u16) >> (10 - bit_offset)
        } else if byte_idx < bytes.len() {
            (bytes[byte_idx] as u16) >> (2 - bit_offset.min(2))
        } else {
            0
        };
        result.push(chars[(val & 0x3F) as usize] as char);
    }

    result
}
