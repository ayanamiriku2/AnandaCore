use axum::{extract::State, Json};
use std::sync::Arc;
use crate::{errors::AppError, services::dashboard_service, AppState};

pub async fn overview(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, AppError> {
    let data = dashboard_service::get_overview(&state.db).await?;
    Ok(Json(data))
}

pub async fn charts(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, AppError> {
    let data = dashboard_service::get_charts(&state.db).await?;
    Ok(Json(data))
}
