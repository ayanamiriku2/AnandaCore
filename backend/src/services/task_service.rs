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
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR status = $1) \
         AND ($2::text IS NULL OR priority = $2) \
         AND ($3::uuid IS NULL OR assigned_to = $3) \
         AND ($4::uuid IS NULL OR department_id = $4) \
         AND ($5::bool IS NOT TRUE OR (due_date < NOW() AND status != 'selesai')) \
         AND ($6::text IS NULL OR title ILIKE '%' || $6 || '%' OR description ILIKE '%' || $6 || '%')"
    )
    .bind(&filter.status)
    .bind(&filter.priority)
    .bind(filter.assigned_to)
    .bind(filter.department_id)
    .bind(filter.overdue)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR status = $1) \
         AND ($2::text IS NULL OR priority = $2) \
         AND ($3::uuid IS NULL OR assigned_to = $3) \
         AND ($4::uuid IS NULL OR department_id = $4) \
         AND ($5::bool IS NOT TRUE OR (due_date < NOW() AND status != 'selesai')) \
         AND ($6::text IS NULL OR title ILIKE '%' || $6 || '%' OR description ILIKE '%' || $6 || '%') \
         ORDER BY CASE WHEN status = 'terlambat' THEN 0 WHEN priority = 'urgent' THEN 1 ELSE 2 END, due_date ASC NULLS LAST LIMIT $7 OFFSET $8"
    )
    .bind(&filter.status)
    .bind(&filter.priority)
    .bind(filter.assigned_to)
    .bind(filter.department_id)
    .bind(filter.overdue)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

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
