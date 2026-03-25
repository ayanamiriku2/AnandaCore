use sqlx::PgPool;
use uuid::Uuid;
use crate::{db::*, errors::AppError, models::*};

pub async fn list_notifications(pool: &PgPool, user_id: Uuid, pagination: &PaginationParams) -> Result<PaginatedResponse<Notification>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM notifications WHERE user_id = $1")
        .bind(user_id).fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(pagination.per_page()).bind(pagination.offset()).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn mark_as_read(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2")
        .bind(id).bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn mark_all_read(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false")
        .bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn unread_count(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false")
        .bind(user_id).fetch_one(pool).await.unwrap_or(0);
    Ok(count)
}
