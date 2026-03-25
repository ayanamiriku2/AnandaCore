use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_activity(pool: &PgPool, req: CreateActivityRequest, user_id: Uuid) -> Result<Activity, AppError> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"INSERT INTO activities (program_id, activity_type_id, name, description, location_id,
            location_detail, activity_date, start_time, end_time, pic_user_id, target_participants, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *"#
    )
    .bind(req.program_id)
    .bind(req.activity_type_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(req.location_id)
    .bind(&req.location_detail)
    .bind(req.activity_date)
    .bind(req.start_time)
    .bind(req.end_time)
    .bind(req.pic_user_id)
    .bind(req.target_participants)
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(activity)
}

pub async fn list_activities(pool: &PgPool, pagination: &PaginationParams, filter: &ActivityFilter) -> Result<PaginatedResponse<Activity>, AppError> {
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM activities WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR program_id = $1) \
         AND ($2::text IS NULL OR status = $2) \
         AND ($3::date IS NULL OR activity_date >= $3) \
         AND ($4::date IS NULL OR activity_date <= $4) \
         AND ($5::uuid IS NULL OR location_id = $5) \
         AND ($6::text IS NULL OR name ILIKE '%' || $6 || '%' OR description ILIKE '%' || $6 || '%')"
    )
    .bind(filter.program_id)
    .bind(&filter.status)
    .bind(filter.date_from)
    .bind(filter.date_to)
    .bind(filter.location_id)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Activity>(
        "SELECT * FROM activities WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR program_id = $1) \
         AND ($2::text IS NULL OR status = $2) \
         AND ($3::date IS NULL OR activity_date >= $3) \
         AND ($4::date IS NULL OR activity_date <= $4) \
         AND ($5::uuid IS NULL OR location_id = $5) \
         AND ($6::text IS NULL OR name ILIKE '%' || $6 || '%' OR description ILIKE '%' || $6 || '%') \
         ORDER BY activity_date DESC LIMIT $7 OFFSET $8"
    )
    .bind(filter.program_id)
    .bind(&filter.status)
    .bind(filter.date_from)
    .bind(filter.date_to)
    .bind(filter.location_id)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_activity(pool: &PgPool, id: Uuid) -> Result<Activity, AppError> {
    sqlx::query_as::<_, Activity>("SELECT * FROM activities WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Kegiatan tidak ditemukan".into()))
}

pub async fn update_activity(pool: &PgPool, id: Uuid, req: UpdateActivityRequest) -> Result<Activity, AppError> {
    sqlx::query_as::<_, Activity>(
        r#"UPDATE activities SET
            name = COALESCE($2, name), description = COALESCE($3, description),
            status = COALESCE($4, status), actual_participants = COALESCE($5, actual_participants),
            has_proposal = COALESCE($6, has_proposal), has_attendance = COALESCE($7, has_attendance),
            has_documentation = COALESCE($8, has_documentation), has_report = COALESCE($9, has_report),
            has_evaluation = COALESCE($10, has_evaluation), notes = COALESCE($11, notes)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id).bind(&req.name).bind(&req.description).bind(&req.status)
    .bind(req.actual_participants).bind(req.has_proposal).bind(req.has_attendance)
    .bind(req.has_documentation).bind(req.has_report).bind(req.has_evaluation)
    .bind(&req.notes)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_activity(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE activities SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
