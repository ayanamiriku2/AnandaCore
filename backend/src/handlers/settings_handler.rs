use axum::{extract::{Path, State}, Json};
use std::sync::Arc;
use crate::{errors::AppError, middleware::auth_middleware::CurrentUser, models::*, AppState};

pub async fn list(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Setting>>, AppError> {
    let data = sqlx::query_as::<_, Setting>("SELECT * FROM settings ORDER BY key")
        .fetch_all(&state.db).await?;
    Ok(Json(data))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(key): Path<String>,
    Json(req): Json<UpdateSettingRequest>,
) -> Result<Json<Setting>, AppError> {
    let setting = sqlx::query_as::<_, Setting>(
        "UPDATE settings SET value = $2, updated_by = $3 WHERE key = $1 RETURNING *"
    ).bind(&key).bind(&req.value).bind(current.id).fetch_one(&state.db).await
    .map_err(|_| AppError::NotFound("Pengaturan tidak ditemukan".into()))?;
    Ok(Json(setting))
}
