use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::media_service, AppState};

pub async fn list_albums(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = media_service::list_albums(&state.db, &params).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get_album(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;
    Ok(Json(serde_json::json!({"album": album, "assets": assets})))
}

pub async fn create_album(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateAlbumRequest>) -> Result<Json<MediaAlbum>, AppError> {
    Ok(Json(media_service::create_album(&state.db, req, current.id).await?))
}

pub async fn list_assets(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<MediaFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = media_service::list_assets(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}
