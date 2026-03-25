use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::program_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<ProgramFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = program_service::list_programs(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Program>, AppError> {
    Ok(Json(program_service::get_program(&state.db, id).await?))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateProgramRequest>) -> Result<Json<Program>, AppError> {
    Ok(Json(program_service::create_program(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateProgramRequest>) -> Result<Json<Program>, AppError> {
    Ok(Json(program_service::update_program(&state.db, id, req).await?))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    program_service::delete_program(&state.db, id).await?;
    Ok(Json(serde_json::json!({"message": "Program berhasil dihapus"})))
}
