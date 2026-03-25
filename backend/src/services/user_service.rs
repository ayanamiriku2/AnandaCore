use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_user(pool: &PgPool, req: CreateUserRequest, created_by: Uuid) -> Result<User, AppError> {
    if req.password.len() < 8 {
        return Err(AppError::Validation("Password minimal 8 karakter".into()));
    }

    let exists = sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
        .bind(&req.email)
        .fetch_one(pool)
        .await?;

    if exists {
        return Err(AppError::Conflict("Email sudah terdaftar".into()));
    }

    let password_hash = auth::hash_password(&req.password)?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.full_name)
    .bind(&req.phone)
    .fetch_one(pool)
    .await?;

    if let Some(role_ids) = req.role_ids {
        for role_id in role_ids {
            sqlx::query("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
                .bind(user.id)
                .bind(role_id)
                .bind(created_by)
                .execute(pool)
                .await?;
        }
    }

    Ok(user)
}

pub async fn list_users(pool: &PgPool, pagination: &PaginationParams, search: Option<&str>) -> Result<PaginatedResponse<UserSummary>, AppError> {
    let (count_query, data_query) = if let Some(q) = search {
        let pattern = format!("%{}%", q);
        let total: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND (full_name ILIKE $1 OR email ILIKE $1)"
        )
        .bind(&pattern)
        .fetch_one(pool)
        .await?;

        let data = sqlx::query_as::<_, UserSummary>(
            "SELECT id, email, full_name, phone, is_active, last_login_at, created_at FROM users WHERE deleted_at IS NULL AND (full_name ILIKE $1 OR email ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(&pattern)
        .bind(pagination.per_page())
        .bind(pagination.offset())
        .fetch_all(pool)
        .await?;

        (total, data)
    } else {
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")
            .fetch_one(pool)
            .await?;

        let data = sqlx::query_as::<_, UserSummary>(
            "SELECT id, email, full_name, phone, is_active, last_login_at, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2"
        )
        .bind(pagination.per_page())
        .bind(pagination.offset())
        .fetch_all(pool)
        .await?;

        (total, data)
    };

    Ok(PaginatedResponse::new(data_query, count_query, pagination))
}

pub async fn get_user(pool: &PgPool, id: Uuid) -> Result<User, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan".into()))
}

pub async fn update_user(pool: &PgPool, id: Uuid, req: UpdateUserRequest) -> Result<User, AppError> {
    let user = get_user(pool, id).await?;

    let full_name = req.full_name.unwrap_or(user.full_name);
    let phone = req.phone.or(user.phone);
    let is_active = req.is_active.unwrap_or(user.is_active);

    sqlx::query_as::<_, User>(
        "UPDATE users SET full_name = $2, phone = $3, is_active = $4 WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .bind(&full_name)
    .bind(&phone)
    .bind(is_active)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)
}

pub async fn soft_delete_user(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE users SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_user_roles(pool: &PgPool, user_id: Uuid) -> Result<Vec<Role>, AppError> {
    let roles = sqlx::query_as::<_, Role>(
        "SELECT r.* FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(roles)
}

pub async fn assign_roles(pool: &PgPool, user_id: Uuid, role_ids: Vec<Uuid>, assigned_by: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await?;

    for role_id in role_ids {
        sqlx::query("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(role_id)
            .bind(assigned_by)
            .execute(pool)
            .await?;
    }

    Ok(())
}
