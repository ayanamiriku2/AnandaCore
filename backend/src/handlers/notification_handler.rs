use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, services::notification_service, AppState};

pub async fn list(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = notification_service::list_notifications(&state.db, current.id, &params).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn mark_read(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    notification_service::mark_as_read(&state.db, id, current.id).await?;
    Ok(Json(serde_json::json!({"message": "Notifikasi ditandai sudah dibaca"})))
}

pub async fn mark_all_read(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
) -> Result<Json<serde_json::Value>, AppError> {
    notification_service::mark_all_read(&state.db, current.id).await?;
    Ok(Json(serde_json::json!({"message": "Semua notifikasi ditandai sudah dibaca"})))
}

pub async fn unread_count(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
) -> Result<Json<serde_json::Value>, AppError> {
    let count = notification_service::unread_count(&state.db, current.id).await?;
    Ok(Json(serde_json::json!({"count": count})))
}
