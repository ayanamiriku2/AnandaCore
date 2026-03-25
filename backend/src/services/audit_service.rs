use sqlx::PgPool;
use uuid::Uuid;
use crate::{db::*, errors::AppError, models::*};

pub async fn list_audit_logs(pool: &PgPool, pagination: &PaginationParams, filter: &AuditFilter) -> Result<PaginatedResponse<AuditLog>, AppError> {
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM audit_logs WHERE 1=1 \
         AND ($1::uuid IS NULL OR user_id = $1) \
         AND ($2::text IS NULL OR module = $2) \
         AND ($3::text IS NULL OR action = $3) \
         AND ($4::text IS NULL OR entity_type = $4) \
         AND ($5::timestamptz IS NULL OR created_at >= $5) \
         AND ($6::timestamptz IS NULL OR created_at <= $6)"
    )
    .bind(filter.user_id)
    .bind(&filter.module)
    .bind(&filter.action)
    .bind(&filter.entity_type)
    .bind(filter.date_from)
    .bind(filter.date_to)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, AuditLog>(
        "SELECT * FROM audit_logs WHERE 1=1 \
         AND ($1::uuid IS NULL OR user_id = $1) \
         AND ($2::text IS NULL OR module = $2) \
         AND ($3::text IS NULL OR action = $3) \
         AND ($4::text IS NULL OR entity_type = $4) \
         AND ($5::timestamptz IS NULL OR created_at >= $5) \
         AND ($6::timestamptz IS NULL OR created_at <= $6) \
         ORDER BY created_at DESC LIMIT $7 OFFSET $8"
    )
    .bind(filter.user_id)
    .bind(&filter.module)
    .bind(&filter.action)
    .bind(&filter.entity_type)
    .bind(filter.date_from)
    .bind(filter.date_to)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn list_backup_logs(pool: &PgPool, pagination: &PaginationParams) -> Result<PaginatedResponse<BackupLog>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM backup_logs").fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, BackupLog>(
        "SELECT * FROM backup_logs ORDER BY started_at DESC LIMIT $1 OFFSET $2"
    ).bind(pagination.per_page()).bind(pagination.offset()).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn create_audit_log(
    pool: &PgPool,
    user_id: Option<Uuid>,
    action: &str,
    module: &str,
    entity_type: Option<&str>,
    entity_id: Option<Uuid>,
    old_values: Option<serde_json::Value>,
    new_values: Option<serde_json::Value>,
    ip_address: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, old_values, new_values, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(user_id).bind(action).bind(module).bind(entity_type).bind(entity_id)
    .bind(old_values).bind(new_values).bind(ip_address)
    .execute(pool).await?;
    Ok(())
}
