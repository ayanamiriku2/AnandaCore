use axum::{extract::{Query, State}, Json};
use std::sync::Arc;
use crate::{db::PaginationParams, errors::AppError, models::*, services::audit_service, AppState};

pub async fn list(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>, Query(filter): Query<AuditFilter>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = audit_service::list_audit_logs(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn backup_logs(State(state): State<Arc<AppState>>, Query(params): Query<PaginationParams>) -> Result<Json<serde_json::Value>, AppError> {
    let resp = audit_service::list_backup_logs(&state.db, &params).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}
