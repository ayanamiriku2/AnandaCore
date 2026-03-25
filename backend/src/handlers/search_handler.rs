use axum::{extract::{Query, State}, Json};
use std::sync::Arc;
use crate::{errors::AppError, services::search_service, AppState};

#[derive(Debug, serde::Deserialize)]
pub struct SearchQuery {
    pub q: String,
    pub module: Option<String>,
    pub limit: Option<i64>,
}

pub async fn global_search(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    if query.q.trim().is_empty() {
        return Ok(Json(serde_json::json!({"results": []})));
    }
    let results = search_service::global_search(&state.db, &query.q, query.module.as_deref(), query.limit.unwrap_or(20)).await?;
    Ok(Json(results))
}
