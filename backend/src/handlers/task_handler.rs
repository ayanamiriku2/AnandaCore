use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::task_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<TaskFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = task_service::list_tasks(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Task>, AppError> {
    Ok(Json(task_service::get_task(&state.db, id).await?))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateTaskRequest>) -> Result<Json<Task>, AppError> {
    Ok(Json(task_service::create_task(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateTaskRequest>) -> Result<Json<Task>, AppError> {
    Ok(Json(task_service::update_task(&state.db, id, req).await?))
}

pub async fn add_comment(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<TaskComment>, AppError> {
    let content = body["content"].as_str().ok_or(AppError::Validation("content diperlukan".into()))?;
    Ok(Json(task_service::add_comment(&state.db, id, current.id, content).await?))
}
