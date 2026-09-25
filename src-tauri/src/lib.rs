pub mod commands;
pub mod engine;
pub mod graph;
pub mod io;
pub mod spatial;
pub mod state;

use commands::{
    ai, alignment, corridor, drainage, grading, intersection,
    parcel, pipe_network, pressure_network, profile, surface,
    survey, validation,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Surface commands
            surface::create_surface_from_points,
            surface::create_grid_surface,
            surface::get_surface_data,
            surface::update_surface_point,
            surface::add_surface_breakline,
            surface::add_surface_boundary,
            surface::analyze_surface,
            surface::generate_contours,
            surface::compute_volume,
            surface::compute_datum_volume,
            surface::trace_water_drop,
            surface::delineate_watersheds,
            surface::import_dxf_file,
            surface::export_dxf_file,
            surface::import_landxml_file,
            surface::export_landxml_file,
            surface::import_geotiff_file,
            surface::import_geojson_file,
            surface::export_ifc_file,
            surface::delete_object,
            surface::save_project,
            surface::load_project,
            // Alignment commands
            alignment::create_alignment,
            alignment::get_alignment_data,
            alignment::update_alignment,
            alignment::sample_alignment,
            // Profile commands
            profile::create_profile,
            profile::get_profile_data,
            profile::update_profile,
            profile::sample_existing_ground,
            // Corridor commands
            corridor::create_corridor,
            corridor::get_corridor_data,
            corridor::update_corridor,
            corridor::rebuild_corridor,
            // Pipe network commands
            pipe_network::create_pipe_network,
            pipe_network::get_pipe_network_data,
            pipe_network::add_pipe_node,
            pipe_network::add_pipe_segment,
            pipe_network::analyze_network,
            // Grading commands
            grading::create_feature_line,
            grading::get_feature_line_data,
            grading::extract_feature_line_from_surface,
            grading::create_grading,
            // Parcel commands
            parcel::create_parcel,
            parcel::get_parcel_data,
            parcel::subdivide_parcel,
            parcel::import_geojson_parcels,
            // Survey commands
            survey::create_survey_database,
            survey::add_survey_point,
            survey::import_survey_points,
            survey::run_field_to_finish,
            survey::process_field_book,
            // Drainage commands
            drainage::create_catchment,
            drainage::analyze_catchment,
            drainage::create_channel,
            drainage::create_pond,
            drainage::create_underground_storage,
            // Pressure network commands
            pressure_network::create_pressure_network,
            pressure_network::add_pressure_pipe,
            pressure_network::check_pressure_network,
            // Intersection commands
            intersection::create_intersection,
            intersection::get_intersection_data,
            // Validation commands
            validation::validate_project,
            validation::validate_pipe_network,
            // AI commands
            ai::explain_validation,
            ai::set_llm_api_key,
            ai::clear_llm_api_key,
            ai::has_llm_api_key,
            ai::ai_chat,
            ai::list_llm_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TerraForge");
}
