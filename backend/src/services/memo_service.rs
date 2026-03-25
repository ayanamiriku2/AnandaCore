use sqlx::PgPool;
use uuid::Uuid;
use crate::{db::*, errors::AppError, models::*};

pub async fn list_memos(pool: &PgPool, pagination: &PaginationParams) -> Result<PaginatedResponse<Memo>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM memos WHERE deleted_at IS NULL")
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Memo>(
        "SELECT * FROM memos WHERE deleted_at IS NULL ORDER BY is_pinned DESC, created_at DESC LIMIT $1 OFFSET $2"
    ).bind(pagination.per_page()).bind(pagination.offset()).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn create_memo(pool: &PgPool, req: CreateMemoRequest, user_id: Uuid) -> Result<Memo, AppError> {
    let memo = sqlx::query_as::<_, Memo>(
        "INSERT INTO memos (title, content, department_id, priority, is_pinned, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
    ).bind(&req.title).bind(&req.content).bind(req.department_id).bind(req.priority.unwrap_or_else(|| "normal".into())).bind(req.is_pinned.unwrap_or(false)).bind(user_id)
    .fetch_one(pool).await?;

    if let Some(recipients) = req.recipient_user_ids {
        for uid in recipients {
            sqlx::query("INSERT INTO memo_recipients (memo_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
                .bind(memo.id).bind(uid).execute(pool).await?;
        }
    }

    Ok(memo)
}

pub async fn list_announcements(pool: &PgPool) -> Result<Vec<Announcement>, AppError> {
    let data = sqlx::query_as::<_, Announcement>(
        "SELECT * FROM announcements WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY priority DESC, publish_at DESC"
    ).fetch_all(pool).await?;
    Ok(data)
}

pub async fn create_announcement(pool: &PgPool, req: CreateAnnouncementRequest, user_id: Uuid) -> Result<Announcement, AppError> {
    let a = sqlx::query_as::<_, Announcement>(
        "INSERT INTO announcements (title, content, priority, expires_at, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    ).bind(&req.title).bind(&req.content).bind(req.priority.unwrap_or_else(|| "normal".into())).bind(req.expires_at).bind(user_id)
    .fetch_one(pool).await?;
    Ok(a)
}

pub async fn update_memo(pool: &PgPool, id: Uuid, req: UpdateMemoRequest) -> Result<Memo, AppError> {
    sqlx::query_as::<_, Memo>(
        "UPDATE memos SET title = COALESCE($2, title), content = COALESCE($3, content), priority = COALESCE($4, priority), is_pinned = COALESCE($5, is_pinned), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *"
    )
    .bind(id).bind(&req.title).bind(&req.content).bind(&req.priority).bind(req.is_pinned)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_memo(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE memos SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
