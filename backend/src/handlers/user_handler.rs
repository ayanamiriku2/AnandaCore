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
    services::user_service,
    AppState,
};

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let search = filter.get("search").map(|s| s.as_str());
    let resp = user_service::list_users(&state.db, &params, search).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = user_service::get_user(&state.db, id).await?;
    let roles = user_service::get_user_roles(&state.db, id).await?;
    Ok(Json(serde_json::json!({
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
        },
        "roles": roles,
    })))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    let user = user_service::create_user(&state.db, req, current.id).await?;
    Ok(Json(user))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<User>, AppError> {
    let user = user_service::update_user(&state.db, id, req).await?;
    Ok(Json(user))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    user_service::soft_delete_user(&state.db, id).await?;
    Ok(Json(serde_json::json!({"message": "Pengguna berhasil dihapus"})))
}

pub async fn assign_roles(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
    Json(role_ids): Json<Vec<Uuid>>,
) -> Result<Json<serde_json::Value>, AppError> {
    user_service::assign_roles(&state.db, id, role_ids, current.id).await?;
    Ok(Json(serde_json::json!({"message": "Role berhasil diperbarui"})))
}
