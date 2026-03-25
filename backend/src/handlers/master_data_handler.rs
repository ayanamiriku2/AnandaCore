use axum::{extract::{Path, State}, Json};
use std::sync::Arc;
use uuid::Uuid;
use crate::{errors::AppError, models::*, AppState};

// Departments
pub async fn list_departments(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Department>>, AppError> {
    let data = sqlx::query_as::<_, Department>("SELECT * FROM departments WHERE is_active = true ORDER BY name")
        .fetch_all(&state.db).await?;
    Ok(Json(data))
}

pub async fn create_department(State(state): State<Arc<AppState>>, Json(req): Json<CreateDepartmentRequest>) -> Result<Json<Department>, AppError> {
    let d = sqlx::query_as::<_, Department>(
        "INSERT INTO departments (name, code, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING *"
    ).bind(&req.name).bind(&req.code).bind(&req.description).bind(req.parent_id).fetch_one(&state.db).await?;
    Ok(Json(d))
}

pub async fn update_department(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>, Json(req): Json<UpdateDepartmentRequest>) -> Result<Json<Department>, AppError> {
    let d = sqlx::query_as::<_, Department>(
        "UPDATE departments SET name = COALESCE($2, name), code = COALESCE($3, code), description = COALESCE($4, description), is_active = COALESCE($5, is_active) WHERE id = $1 RETURNING *"
    ).bind(id).bind(&req.name).bind(&req.code).bind(&req.description).bind(req.is_active).fetch_one(&state.db).await?;
    Ok(Json(d))
}

// Roles & Permissions
pub async fn list_roles(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Role>>, AppError> {
    let data = sqlx::query_as::<_, Role>("SELECT * FROM roles ORDER BY name").fetch_all(&state.db).await?;
    Ok(Json(data))
}

pub async fn list_permissions(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Permission>>, AppError> {
    let data = sqlx::query_as::<_, Permission>("SELECT * FROM permissions ORDER BY module, action").fetch_all(&state.db).await?;
    Ok(Json(data))
}

pub async fn create_role(State(state): State<Arc<AppState>>, Json(req): Json<CreateRoleRequest>) -> Result<Json<Role>, AppError> {
    let role = sqlx::query_as::<_, Role>(
        "INSERT INTO roles (name, display_name, description) VALUES ($1, $2, $3) RETURNING *"
    ).bind(&req.name).bind(&req.display_name).bind(&req.description).fetch_one(&state.db).await?;
    if let Some(pids) = req.permission_ids {
        for pid in pids {
            sqlx::query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
                .bind(role.id).bind(pid).execute(&state.db).await?;
        }
    }
    Ok(Json(role))
}

// Tags
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct Tag { pub id: uuid::Uuid, pub name: String, pub color: Option<String>, pub created_at: chrono::DateTime<chrono::Utc> }

pub async fn list_tags(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Tag>>, AppError> {
    let data = sqlx::query_as::<_, Tag>("SELECT * FROM tags ORDER BY name").fetch_all(&state.db).await?;
    Ok(Json(data))
}

// Letter Classifications
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct LetterClassification { pub id: uuid::Uuid, pub name: String, pub code: Option<String>, pub description: Option<String>, pub is_active: bool }

pub async fn list_letter_classifications(State(state): State<Arc<AppState>>) -> Result<Json<Vec<LetterClassification>>, AppError> {
    let data = sqlx::query_as::<_, LetterClassification>(
        "SELECT id, name, code, description, is_active FROM letter_classifications WHERE is_active = true ORDER BY name"
    ).fetch_all(&state.db).await?;
    Ok(Json(data))
}

// Activity Types
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct ActivityType { pub id: uuid::Uuid, pub name: String, pub description: Option<String>, pub is_active: bool }

pub async fn list_activity_types(State(state): State<Arc<AppState>>) -> Result<Json<Vec<ActivityType>>, AppError> {
    let data = sqlx::query_as::<_, ActivityType>(
        "SELECT id, name, description, is_active FROM activity_types WHERE is_active = true ORDER BY name"
    ).fetch_all(&state.db).await?;
    Ok(Json(data))
}

// Asset Categories
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct AssetCategory { pub id: uuid::Uuid, pub name: String, pub code: Option<String>, pub description: Option<String>, pub is_active: bool }

pub async fn list_asset_categories(State(state): State<Arc<AppState>>) -> Result<Json<Vec<AssetCategory>>, AppError> {
    let data = sqlx::query_as::<_, AssetCategory>(
        "SELECT id, name, code, description, is_active FROM asset_categories WHERE is_active = true ORDER BY name"
    ).fetch_all(&state.db).await?;
    Ok(Json(data))
}

// Locations
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct Location { pub id: uuid::Uuid, pub name: String, pub address: Option<String>, pub city: Option<String>, pub province: Option<String>, pub is_active: bool }

pub async fn list_locations(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Location>>, AppError> {
    let data = sqlx::query_as::<_, Location>(
        "SELECT id, name, address, city, province, is_active FROM locations WHERE is_active = true ORDER BY name"
    ).fetch_all(&state.db).await?;
    Ok(Json(data))
}

// Participant Statuses
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct ParticipantStatus { pub id: uuid::Uuid, pub name: String, pub description: Option<String>, pub color: Option<String> }

pub async fn list_participant_statuses(State(state): State<Arc<AppState>>) -> Result<Json<Vec<ParticipantStatus>>, AppError> {
    let data = sqlx::query_as::<_, ParticipantStatus>(
        "SELECT id, name, description, color FROM participant_statuses ORDER BY name"
    ).fetch_all(&state.db).await?;
    Ok(Json(data))
}
