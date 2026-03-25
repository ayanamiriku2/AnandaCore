use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_program(pool: &PgPool, req: CreateProgramRequest, user_id: Uuid) -> Result<Program, AppError> {
    let program = sqlx::query_as::<_, Program>(
        r#"INSERT INTO programs (name, program_type_id, description, objectives, target_audience,
            department_id, pic_user_id, start_date, end_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"#
    )
    .bind(&req.name)
    .bind(req.program_type_id)
    .bind(&req.description)
    .bind(&req.objectives)
    .bind(&req.target_audience)
    .bind(req.department_id)
    .bind(req.pic_user_id)
    .bind(req.start_date)
    .bind(req.end_date)
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(program)
}

pub async fn list_programs(pool: &PgPool, pagination: &PaginationParams, filter: &ProgramFilter) -> Result<PaginatedResponse<Program>, AppError> {
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM programs WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR status = $1) \
         AND ($2::uuid IS NULL OR department_id = $2) \
         AND ($3::uuid IS NULL OR program_type_id = $3) \
         AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%')"
    )
    .bind(&filter.status)
    .bind(filter.department_id)
    .bind(filter.program_type_id)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Program>(
        "SELECT * FROM programs WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR status = $1) \
         AND ($2::uuid IS NULL OR department_id = $2) \
         AND ($3::uuid IS NULL OR program_type_id = $3) \
         AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%') \
         ORDER BY created_at DESC LIMIT $5 OFFSET $6"
    )
    .bind(&filter.status)
    .bind(filter.department_id)
    .bind(filter.program_type_id)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_program(pool: &PgPool, id: Uuid) -> Result<Program, AppError> {
    sqlx::query_as::<_, Program>("SELECT * FROM programs WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Program tidak ditemukan".into()))
}

pub async fn update_program(pool: &PgPool, id: Uuid, req: UpdateProgramRequest) -> Result<Program, AppError> {
    sqlx::query_as::<_, Program>(
        r#"UPDATE programs SET name = COALESCE($2, name), description = COALESCE($3, description),
            status = COALESCE($4, status), objectives = COALESCE($5, objectives),
            pic_user_id = COALESCE($6, pic_user_id), end_date = COALESCE($7, end_date)
        WHERE id = $1 AND deleted_at IS NULL RETURNING *"#
    )
    .bind(id).bind(&req.name).bind(&req.description).bind(&req.status)
    .bind(&req.objectives).bind(req.pic_user_id).bind(req.end_date)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_program(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE programs SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
