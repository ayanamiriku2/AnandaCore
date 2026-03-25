use sqlx::PgPool;
use uuid::Uuid;
use crate::{db::*, errors::AppError, models::*};

pub async fn list_audit_logs(pool: &PgPool, pagination: &PaginationParams, filter: &AuditFilter) -> Result<PaginatedResponse<AuditLog>, AppError> {
    let mut conditions = vec!["1=1".to_string()];
    if let Some(uid) = filter.user_id { conditions.push(format!("user_id = '{}'", uid)); }
    if let Some(ref m) = filter.module { conditions.push(format!("module = '{}'", m)); }
    if let Some(ref a) = filter.action { conditions.push(format!("action = '{}'", a)); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM audit_logs WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, AuditLog>(
        &format!("SELECT * FROM audit_logs WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;
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
