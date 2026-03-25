use axum::{extract::{Query, State}, Json};
use std::sync::Arc;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::memo_service, AppState};

pub async fn list_memos(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = memo_service::list_memos(&state.db, &params).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn create_memo(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateMemoRequest>) -> Result<Json<Memo>, AppError> {
    Ok(Json(memo_service::create_memo(&state.db, req, current.id).await?))
}

pub async fn list_announcements(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Announcement>>, AppError> {
    Ok(Json(memo_service::list_announcements(&state.db).await?))
}

pub async fn create_announcement(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateAnnouncementRequest>) -> Result<Json<Announcement>, AppError> {
    Ok(Json(memo_service::create_announcement(&state.db, req, current.id).await?))
}
