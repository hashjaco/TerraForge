use serde::{Deserialize, Serialize};
use crate::engine::survey::{SurveyDatabase, FieldBook, FieldObservation};
use crate::engine::{ObjectType, Point3};
use super::project;

#[derive(Debug, Serialize)]
pub struct SurveyDatabaseResponse {
    pub id: String,
    pub name: String,
    pub point_count: usize,
    pub figure_count: usize,
    pub points: Vec<CogoPointResponse>,
    pub figures: Vec<FigureResponse>,
}

#[derive(Debug, Serialize)]
pub struct CogoPointResponse {
    pub number: u32,
    pub position: [f64; 3],
    pub code: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct FigureResponse {
    pub name: String,
    pub code: String,
    pub point_count: usize,
    pub is_closed: bool,
    pub vertices: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSurveyDbInput {
    pub name: String,
}

#[tauri::command]
pub fn create_survey_database(input: CreateSurveyDbInput) -> Result<SurveyDatabaseResponse, String> {
    let db = SurveyDatabase::new(input.name);
    let response = db_to_response(&db);
    let id = db.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::CogoPoint, format!("Survey: {}", db.name));
    }
    project().survey_databases.write().insert(id, db);
    Ok(response)
}

#[derive(Debug, Deserialize)]
pub struct AddSurveyPointInput {
    pub database_id: String,
    pub position: [f64; 3],
    pub code: String,
    pub description: String,
}

#[tauri::command]
pub fn add_survey_point(input: AddSurveyPointInput) -> Result<SurveyDatabaseResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.database_id).map_err(|e| e.to_string())?;
    let mut dbs = project().survey_databases.write();
    let db = dbs.get_mut(&uuid).ok_or("Survey database not found")?;

    let pos = Point3::new(input.position[0], input.position[1], input.position[2]);
    db.add_point(pos, input.code, input.description);

    Ok(db_to_response(db))
}

#[derive(Debug, Deserialize)]
pub struct ImportSurveyPointsInput {
    pub database_id: String,
    pub points: Vec<SurveyPointImport>,
}

#[derive(Debug, Deserialize)]
pub struct SurveyPointImport {
    pub position: [f64; 3],
    pub code: String,
    pub description: String,
}

#[tauri::command]
pub fn import_survey_points(input: ImportSurveyPointsInput) -> Result<SurveyDatabaseResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.database_id).map_err(|e| e.to_string())?;
    let mut dbs = project().survey_databases.write();
    let db = dbs.get_mut(&uuid).ok_or("Survey database not found")?;

    for pt in &input.points {
        let pos = Point3::new(pt.position[0], pt.position[1], pt.position[2]);
        db.add_point(pos, pt.code.clone(), pt.description.clone());
    }

    Ok(db_to_response(db))
}

#[tauri::command]
pub fn run_field_to_finish(database_id: String) -> Result<SurveyDatabaseResponse, String> {
    let uuid = uuid::Uuid::parse_str(&database_id).map_err(|e| e.to_string())?;
    let mut dbs = project().survey_databases.write();
    let db = dbs.get_mut(&uuid).ok_or("Survey database not found")?;

    db.field_to_finish();
    Ok(db_to_response(db))
}

#[derive(Debug, Deserialize)]
pub struct ProcessFieldBookInput {
    pub database_id: String,
    pub instrument_point: [f64; 3],
    pub observations: Vec<ObservationInput>,
}

#[derive(Debug, Deserialize)]
pub struct ObservationInput {
    pub point_number: u32,
    pub horizontal_angle: f64,
    pub vertical_angle: f64,
    pub slope_distance: f64,
    pub prism_height: f64,
    pub code: String,
    pub description: String,
}

#[tauri::command]
pub fn process_field_book(input: ProcessFieldBookInput) -> Result<SurveyDatabaseResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.database_id).map_err(|e| e.to_string())?;
    let mut dbs = project().survey_databases.write();
    let db = dbs.get_mut(&uuid).ok_or("Survey database not found")?;

    let field_book = FieldBook {
        instrument_point: Point3::new(
            input.instrument_point[0],
            input.instrument_point[1],
            input.instrument_point[2],
        ),
        observations: input.observations.iter().map(|o| FieldObservation {
            point_number: o.point_number,
            horizontal_angle: o.horizontal_angle,
            vertical_angle: o.vertical_angle,
            slope_distance: o.slope_distance,
            prism_height: o.prism_height,
            code: o.code.clone(),
            description: o.description.clone(),
        }).collect(),
    };

    db.process_field_book(&field_book);
    Ok(db_to_response(db))
}

fn db_to_response(db: &SurveyDatabase) -> SurveyDatabaseResponse {
    SurveyDatabaseResponse {
        id: db.id.to_string(),
        name: db.name.clone(),
        point_count: db.points.len(),
        figure_count: db.figures.len(),
        points: db.points.iter().map(|p| CogoPointResponse {
            number: p.number,
            position: [p.position.x, p.position.y, p.position.z],
            code: p.code.clone(),
            description: p.full_description.clone(),
        }).collect(),
        figures: db.figures.iter().map(|f| FigureResponse {
            name: f.name.clone(),
            code: f.code.clone(),
            point_count: f.vertices.len(),
            is_closed: f.is_closed,
            vertices: f.vertices.iter().flat_map(|v| vec![v.x, v.y, v.z]).collect(),
        }).collect(),
    }
}
