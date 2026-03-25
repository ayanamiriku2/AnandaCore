use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::activity_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<ActivityFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = activity_service::list_activities(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Activity>, AppError> {
    Ok(Json(activity_service::get_activity(&state.db, id).await?))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateActivityRequest>) -> Result<Json<Activity>, AppError> {
    Ok(Json(activity_service::create_activity(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateActivityRequest>) -> Result<Json<Activity>, AppError> {
    Ok(Json(activity_service::update_activity(&state.db, id, req).await?))
}
