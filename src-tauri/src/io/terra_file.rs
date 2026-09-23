use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct TerraFile {
    pub version: String,
    pub project_name: String,
    pub metadata: TerraMetadata,
    pub geometry_blob: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TerraMetadata {
    pub created_at: u64,
    pub modified_at: u64,
    pub author: String,
    pub description: String,
    pub object_count: usize,
}

impl TerraFile {
    pub fn new(project_name: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            version: "0.1.0".into(),
            project_name,
            metadata: TerraMetadata {
                created_at: now,
                modified_at: now,
                author: String::new(),
                description: String::new(),
                object_count: 0,
            },
            geometry_blob: Vec::new(),
        }
    }

    pub fn save(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let json_meta = serde_json::to_string_pretty(&self)?;
        std::fs::write(path, json_meta)?;
        Ok(())
    }

    pub fn load(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(path)?;
        let file: TerraFile = serde_json::from_str(&content)?;
        Ok(file)
    }
}
