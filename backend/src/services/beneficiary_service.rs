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
    let mut conditions = vec!["deleted_at IS NULL".to_string()];
    if let Some(sid) = filter.status_id { conditions.push(format!("status_id = '{}'", sid)); }
    if let Some(ref c) = filter.city { conditions.push(format!("city = '{}'", c)); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM beneficiaries WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Beneficiary>(
        &format!("SELECT * FROM beneficiaries WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;
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
            placement_status = COALESCE($6, placement_status), internal_notes = COALESCE($7, internal_notes)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id).bind(&req.full_name).bind(&req.phone).bind(&req.address)
    .bind(req.status_id).bind(&req.placement_status).bind(&req.internal_notes)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_beneficiary(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE beneficiaries SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
