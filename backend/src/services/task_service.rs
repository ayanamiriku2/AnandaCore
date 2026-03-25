use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_task(pool: &PgPool, req: CreateTaskRequest, user_id: Uuid) -> Result<Task, AppError> {
    let task = sqlx::query_as::<_, Task>(
        r#"INSERT INTO tasks (title, description, assigned_to, department_id, priority, due_date, assigned_by, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *"#
    )
    .bind(&req.title).bind(&req.description).bind(req.assigned_to)
    .bind(req.department_id).bind(req.priority.unwrap_or_else(|| "normal".into()))
    .bind(req.due_date).bind(user_id)
    .fetch_one(pool).await?;
    Ok(task)
}

pub async fn list_tasks(pool: &PgPool, pagination: &PaginationParams, filter: &TaskFilter) -> Result<PaginatedResponse<Task>, AppError> {
    let mut conditions = vec!["deleted_at IS NULL".to_string()];
    if let Some(ref s) = filter.status { conditions.push(format!("status = '{}'", s)); }
    if let Some(ref p) = filter.priority { conditions.push(format!("priority = '{}'", p)); }
    if let Some(uid) = filter.assigned_to { conditions.push(format!("assigned_to = '{}'", uid)); }
    if filter.overdue == Some(true) { conditions.push("due_date < NOW() AND status != 'selesai'".to_string()); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM tasks WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Task>(
        &format!("SELECT * FROM tasks WHERE {} ORDER BY CASE WHEN status = 'terlambat' THEN 0 WHEN priority = 'urgent' THEN 1 ELSE 2 END, due_date ASC NULLS LAST LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_task(pool: &PgPool, id: Uuid) -> Result<Task, AppError> {
    sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Tugas tidak ditemukan".into()))
}

pub async fn update_task(pool: &PgPool, id: Uuid, req: UpdateTaskRequest) -> Result<Task, AppError> {
    let completed_at = if req.status.as_deref() == Some("selesai") { Some(chrono::Utc::now()) } else { None };
    sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET title = COALESCE($2, title), description = COALESCE($3, description),
            status = COALESCE($4, status), priority = COALESCE($5, priority),
            assigned_to = COALESCE($6, assigned_to), due_date = COALESCE($7, due_date),
            completed_at = COALESCE($8, completed_at)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id).bind(&req.title).bind(&req.description).bind(&req.status)
    .bind(&req.priority).bind(req.assigned_to).bind(req.due_date).bind(completed_at)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn add_comment(pool: &PgPool, task_id: Uuid, user_id: Uuid, content: &str) -> Result<TaskComment, AppError> {
    let comment = sqlx::query_as::<_, TaskComment>(
        "INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *"
    ).bind(task_id).bind(user_id).bind(content).fetch_one(pool).await?;
    Ok(comment)
}

pub async fn delete_task(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE tasks SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
