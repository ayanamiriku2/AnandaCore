use axum::{
    extract::{Path, Query, State},
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::PaginationParams,
    errors::AppError,
    middleware::auth_middleware::CurrentUser,
    models::*,
    services::document_service,
    AppState,
};

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<DocumentFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = document_service::list_documents(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::get_document(&state.db, id).await?;
    Ok(Json(doc))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateDocumentRequest>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::create_document(&state.db, req, current.id).await?;
    Ok(Json(doc))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateDocumentRequest>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::update_document(&state.db, id, req).await?;
    Ok(Json(doc))
}

pub async fn verify(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::verify_document(&state.db, id, current.id).await?;
    Ok(Json(doc))
}

pub async fn versions(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<DocumentVersion>>, AppError> {
    let versions = document_service::get_document_versions(&state.db, id).await?;
    Ok(Json(versions))
}

pub async fn categories(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<DocumentCategory>>, AppError> {
    let cats = document_service::list_categories(&state.db).await?;
    Ok(Json(cats))
}
