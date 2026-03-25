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
    let mut conditions = vec!["deleted_at IS NULL".to_string()];
    if let Some(ref s) = filter.status { conditions.push(format!("status = '{}'", s)); }
    if let Some(did) = filter.department_id { conditions.push(format!("department_id = '{}'", did)); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM programs WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Program>(
        &format!("SELECT * FROM programs WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_program(pool: &PgPool, id: Uuid) -> Result<Program, AppError> {
    sqlx::query_as::<_, Program>("SELECT * FROM programs WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Program tidak ditemukan".into()))
}

pub async fn update_program(pool: &PgPool, id: Uuid, req: UpdateProgramRequest) -> Result<Program, AppError> {
    sqlx::query_as::<_, Program>(
        "UPDATE programs SET name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4, status) WHERE id = $1 RETURNING *"
    )
    .bind(id).bind(&req.name).bind(&req.description).bind(&req.status)
    .fetch_one(pool).await.map_err(AppError::from)
}
