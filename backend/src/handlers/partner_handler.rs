use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{db::PaginationParams, errors::AppError, middleware::auth_middleware::CurrentUser, models::*, services::partner_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<PartnerFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = partner_service::list_partners(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    let partner = partner_service::get_partner(&state.db, id).await?;
    let contacts = partner_service::get_contacts(&state.db, id).await?;
    let agreements = partner_service::get_agreements(&state.db, id).await?;
    Ok(Json(serde_json::json!({"partner": partner, "contacts": contacts, "agreements": agreements})))
}

pub async fn create(State(state): State<Arc<AppState>>, axum::Extension(current): axum::Extension<CurrentUser>, Json(req): Json<CreatePartnerRequest>) -> Result<Json<Partner>, AppError> {
    Ok(Json(partner_service::create_partner(&state.db, req, current.id).await?))
}

pub async fn update(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdatePartnerRequest>) -> Result<Json<Partner>, AppError> {
    Ok(Json(partner_service::update_partner(&state.db, id, req).await?))
}

pub async fn contacts(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Vec<PartnerContact>>, AppError> {
    Ok(Json(partner_service::get_contacts(&state.db, id).await?))
}

pub async fn agreements(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Result<Json<Vec<PartnershipAgreement>>, AppError> {
    Ok(Json(partner_service::get_agreements(&state.db, id).await?))
}
