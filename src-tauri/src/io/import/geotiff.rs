use crate::engine::Point3;

/// Import elevation data from a simple ASCII grid (ASC/GRD) format.
/// GeoTIFF binary parsing requires the `tiff` crate; this provides
/// the data model and ASCII grid support.
pub fn import_ascii_grid(content: &str) -> Result<GridImportData, String> {
    let mut ncols = 0usize;
    let mut nrows = 0usize;
    let mut xllcorner = 0.0_f64;
    let mut yllcorner = 0.0_f64;
    let mut cellsize = 1.0_f64;
    let mut nodata = -9999.0_f64;
    let mut elevations = Vec::new();
    let mut header_lines = 0;

    for line in content.lines() {
        let trimmed = line.trim();
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 2 {
            match parts[0].to_lowercase().as_str() {
                "ncols" => {
                    ncols = parts[1].parse().unwrap_or(0);
                    header_lines += 1;
                    continue;
                }
                "nrows" => {
                    nrows = parts[1].parse().unwrap_or(0);
                    header_lines += 1;
                    continue;
                }
                "xllcorner" | "xllcenter" => {
                    xllcorner = parts[1].parse().unwrap_or(0.0);
                    header_lines += 1;
                    continue;
                }
                "yllcorner" | "yllcenter" => {
                    yllcorner = parts[1].parse().unwrap_or(0.0);
                    header_lines += 1;
                    continue;
                }
                "cellsize" => {
                    cellsize = parts[1].parse().unwrap_or(1.0);
                    header_lines += 1;
                    continue;
                }
                "nodata_value" | "nodata" => {
                    nodata = parts[1].parse().unwrap_or(-9999.0);
                    header_lines += 1;
                    continue;
                }
                _ => {}
            }
        }

        // Data lines
        for val_str in parts {
            if let Ok(val) = val_str.parse::<f64>() {
                elevations.push(val);
            }
        }
    }

    if ncols == 0 || nrows == 0 {
        return Err("Invalid grid header: missing ncols or nrows".into());
    }

    // Replace nodata values with interpolated or zero
    for elev in &mut elevations {
        if (*elev - nodata).abs() < 1e-6 {
            *elev = 0.0;
        }
    }

    Ok(GridImportData {
        ncols,
        nrows,
        xll: xllcorner,
        yll: yllcorner,
        cellsize,
        elevations,
    })
}

/// Import elevation data from a binary GeoTIFF file.
pub fn import_geotiff(data: &[u8]) -> Result<GridImportData, String> {
    use tiff::decoder::Decoder;
    use std::io::Cursor;

    let cursor = Cursor::new(data);
    let mut decoder = Decoder::new(cursor).map_err(|e| format!("Failed to open TIFF: {}", e))?;

    let (width, height) = decoder.dimensions().map_err(|e| format!("Failed to get dimensions: {}", e))?;

    let image_data = decoder
        .read_image()
        .map_err(|e| format!("Failed to read image data: {}", e))?;

    let elevations: Vec<f64> = match image_data {
        tiff::decoder::DecodingResult::F32(data) => data.iter().map(|&v| v as f64).collect(),
        tiff::decoder::DecodingResult::F64(data) => data.to_vec(),
        tiff::decoder::DecodingResult::U8(data) => data.iter().map(|&v| v as f64).collect(),
        tiff::decoder::DecodingResult::U16(data) => data.iter().map(|&v| v as f64).collect(),
        tiff::decoder::DecodingResult::U32(data) => data.iter().map(|&v| v as f64).collect(),
        tiff::decoder::DecodingResult::I16(data) => data.iter().map(|&v| v as f64).collect(),
        tiff::decoder::DecodingResult::I32(data) => data.iter().map(|&v| v as f64).collect(),
        _ => return Err("Unsupported TIFF data type".into()),
    };

    Ok(GridImportData {
        ncols: width as usize,
        nrows: height as usize,
        xll: 0.0,
        yll: 0.0,
        cellsize: 1.0,
        elevations,
    })
}

/// Convert grid data to 3D points for surface creation.
pub fn grid_to_points(data: &GridImportData) -> Vec<Point3> {
    let mut points = Vec::with_capacity(data.ncols * data.nrows);
    for row in 0..data.nrows {
        for col in 0..data.ncols {
            let x = data.xll + col as f64 * data.cellsize;
            let y = data.yll + (data.nrows - 1 - row) as f64 * data.cellsize;
            let idx = row * data.ncols + col;
            let z = if idx < data.elevations.len() {
                data.elevations[idx]
            } else {
                0.0
            };
            points.push(Point3::new(x, y, z));
        }
    }
    points
}

#[derive(Debug, Clone)]
pub struct GridImportData {
    pub ncols: usize,
    pub nrows: usize,
    pub xll: f64,
    pub yll: f64,
    pub cellsize: f64,
    pub elevations: Vec<f64>,
}
