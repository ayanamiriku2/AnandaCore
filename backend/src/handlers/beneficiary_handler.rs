use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::beneficiary_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<BeneficiaryFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = beneficiary_service::list_beneficiaries(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Beneficiary>, AppError> {
    Ok(Json(beneficiary_service::get_beneficiary(&state.db, id).await?))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreateBeneficiaryRequest>) -> Result<Json<Beneficiary>, AppError> {
    Ok(Json(beneficiary_service::create_beneficiary(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateBeneficiaryRequest>) -> Result<Json<Beneficiary>, AppError> {
    Ok(Json(beneficiary_service::update_beneficiary(&state.db, id, req).await?))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    beneficiary_service::delete_beneficiary(&state.db, id).await?;
    Ok(Json(serde_json::json!({"message": "Penerima manfaat berhasil dihapus"})))
}
