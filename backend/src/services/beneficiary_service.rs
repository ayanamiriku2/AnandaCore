use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_beneficiary(pool: &PgPool, req: CreateBeneficiaryRequest, user_id: Uuid) -> Result<Beneficiary, AppError> {
    let b = sqlx::query_as::<_, Beneficiary>(
        r#"INSERT INTO beneficiaries (full_name, nik, gender, birth_date, birth_place,
            address, city, province, phone, email, education_level, school_origin, status_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *"#
    )
    .bind(&req.full_name).bind(&req.nik).bind(&req.gender)
    .bind(req.birth_date).bind(&req.birth_place)
    .bind(&req.address).bind(&req.city).bind(&req.province)
    .bind(&req.phone).bind(&req.email).bind(&req.education_level)
    .bind(&req.school_origin).bind(req.status_id).bind(user_id)
    .fetch_one(pool).await?;
    Ok(b)
}

pub async fn list_beneficiaries(pool: &PgPool, pagination: &PaginationParams, filter: &BeneficiaryFilter) -> Result<PaginatedResponse<Beneficiary>, AppError> {
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM beneficiaries WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR status_id = $1) \
         AND ($2::text IS NULL OR city = $2) \
         AND ($3::text IS NULL OR education_level = $3) \
         AND ($4::text IS NULL OR placement_status = $4) \
         AND ($5::text IS NULL OR full_name ILIKE '%' || $5 || '%' OR nik ILIKE '%' || $5 || '%' OR address ILIKE '%' || $5 || '%')"
    )
    .bind(filter.status_id)
    .bind(&filter.city)
    .bind(&filter.education_level)
    .bind(&filter.placement_status)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Beneficiary>(
        "SELECT * FROM beneficiaries WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR status_id = $1) \
         AND ($2::text IS NULL OR city = $2) \
         AND ($3::text IS NULL OR education_level = $3) \
         AND ($4::text IS NULL OR placement_status = $4) \
         AND ($5::text IS NULL OR full_name ILIKE '%' || $5 || '%' OR nik ILIKE '%' || $5 || '%' OR address ILIKE '%' || $5 || '%') \
         ORDER BY created_at DESC LIMIT $6 OFFSET $7"
    )
    .bind(filter.status_id)
    .bind(&filter.city)
    .bind(&filter.education_level)
    .bind(&filter.placement_status)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_beneficiary(pool: &PgPool, id: Uuid) -> Result<Beneficiary, AppError> {
    sqlx::query_as::<_, Beneficiary>("SELECT * FROM beneficiaries WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Peserta/alumni tidak ditemukan".into()))
}

pub async fn update_beneficiary(pool: &PgPool, id: Uuid, req: UpdateBeneficiaryRequest) -> Result<Beneficiary, AppError> {
    sqlx::query_as::<_, Beneficiary>(
        r#"UPDATE beneficiaries SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone),
            address = COALESCE($4, address), status_id = COALESCE($5, status_id),
            placement_status = COALESCE($6, placement_status), placement_partner_id = COALESCE($7, placement_partner_id),
            internal_notes = COALESCE($8, internal_notes)
        WHERE id = $1 AND deleted_at IS NULL RETURNING *"#
    )
    .bind(id).bind(&req.full_name).bind(&req.phone).bind(&req.address)
    .bind(req.status_id).bind(&req.placement_status).bind(req.placement_partner_id)
    .bind(&req.internal_notes)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_beneficiary(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE beneficiaries SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
