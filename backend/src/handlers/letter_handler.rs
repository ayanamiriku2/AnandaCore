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
    services::letter_service,
    AppState,
};

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<LetterFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = letter_service::list_letters(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::get_letter(&state.db, id).await?;
    Ok(Json(letter))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateLetterRequest>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::create_letter(&state.db, req, current.id).await?;
    Ok(Json(letter))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateLetterRequest>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::update_letter(&state.db, id, req).await?;
    Ok(Json(letter))
}

pub async fn create_disposition(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(letter_id): Path<Uuid>,
    Json(req): Json<CreateDispositionRequest>,
) -> Result<Json<LetterDisposition>, AppError> {
    let disp = letter_service::create_disposition(&state.db, letter_id, req, current.id).await?;
    Ok(Json(disp))
}

pub async fn get_dispositions(
    State(state): State<Arc<AppState>>,
    Path(letter_id): Path<Uuid>,
) -> Result<Json<Vec<LetterDisposition>>, AppError> {
    let disps = letter_service::get_dispositions(&state.db, letter_id).await?;
    Ok(Json(disps))
}
