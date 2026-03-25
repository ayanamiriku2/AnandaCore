use axum::{extract::State, Json};
use std::sync::Arc;

use crate::{errors::AppError, models::*, services::{auth_service, audit_service}, AppState};

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = req.email.clone();
    let resp = auth_service::login(
        &state.db,
        req,
        &state.config.jwt_secret,
        state.config.jwt_expiry_hours,
        state.config.refresh_token_expiry_days,
    )
    .await?;
    // Log successful login
    let _ = audit_service::create_audit_log(
        &state.db,
        Some(resp.user.id),
        "login",
        "auth",
        Some("user"),
        Some(resp.user.id),
        None,
        Some(serde_json::json!({"email": email})),
        None,
    ).await;
    Ok(Json(resp))
}

pub async fn refresh(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let resp = auth_service::refresh_token(
        &state.db,
        &req.refresh_token,
        &state.config.jwt_secret,
        state.config.jwt_expiry_hours,
    )
    .await?;
    Ok(Json(resp))
}

pub async fn me(
    State(state): State<Arc<AppState>>,
    axum::Extension(user): axum::Extension<crate::middleware::auth_middleware::CurrentUser>,
) -> Result<Json<serde_json::Value>, AppError> {
    let u = crate::services::user_service::get_user(&state.db, user.id).await?;
    let roles = crate::services::user_service::get_user_roles(&state.db, user.id).await?;
    Ok(Json(serde_json::json!({
        "user": {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "avatar_url": u.avatar_url,
            "is_active": u.is_active,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
        },
        "roles": roles.iter().map(|r| &r.name).collect::<Vec<_>>(),
    })))
}
