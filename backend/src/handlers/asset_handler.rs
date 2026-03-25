use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::asset_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<AssetFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = asset_service::list_assets(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Asset>, AppError> {
    Ok(Json(asset_service::get_asset(&state.db, id).await?))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateAssetRequest>) -> Result<Json<Asset>, AppError> {
    Ok(Json(asset_service::create_asset(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateAssetRequest>) -> Result<Json<Asset>, AppError> {
    Ok(Json(asset_service::update_asset(&state.db, id, req).await?))
}
