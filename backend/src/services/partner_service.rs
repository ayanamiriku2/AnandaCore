use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_partner(pool: &PgPool, req: CreatePartnerRequest, user_id: Uuid) -> Result<Partner, AppError> {
    let partner = sqlx::query_as::<_, Partner>(
        r#"INSERT INTO partners (name, partner_type, industry, address, city, province,
            website, email, phone, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *"#
    )
    .bind(&req.name).bind(&req.partner_type).bind(&req.industry)
    .bind(&req.address).bind(&req.city).bind(&req.province)
    .bind(&req.website).bind(&req.email).bind(&req.phone)
    .bind(&req.description).bind(user_id)
    .fetch_one(pool).await?;
    Ok(partner)
}

pub async fn list_partners(pool: &PgPool, pagination: &PaginationParams, filter: &PartnerFilter) -> Result<PaginatedResponse<Partner>, AppError> {
    let mut conditions = vec!["deleted_at IS NULL".to_string()];
    if let Some(ref pt) = filter.partner_type { conditions.push(format!("partner_type = '{}'", pt)); }
    if let Some(ref ps) = filter.pipeline_status { conditions.push(format!("pipeline_status = '{}'", ps)); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM partners WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, Partner>(
        &format!("SELECT * FROM partners WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_partner(pool: &PgPool, id: Uuid) -> Result<Partner, AppError> {
    sqlx::query_as::<_, Partner>("SELECT * FROM partners WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Mitra tidak ditemukan".into()))
}

pub async fn update_partner(pool: &PgPool, id: Uuid, req: UpdatePartnerRequest) -> Result<Partner, AppError> {
    sqlx::query_as::<_, Partner>(
        r#"UPDATE partners SET name = COALESCE($2, name), partner_type = COALESCE($3, partner_type),
            pipeline_status = COALESCE($4, pipeline_status), internal_notes = COALESCE($5, internal_notes)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id).bind(&req.name).bind(&req.partner_type)
    .bind(&req.pipeline_status).bind(&req.internal_notes)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn get_contacts(pool: &PgPool, partner_id: Uuid) -> Result<Vec<PartnerContact>, AppError> {
    let contacts = sqlx::query_as::<_, PartnerContact>(
        "SELECT * FROM partner_contacts WHERE partner_id = $1 ORDER BY is_primary DESC, name"
    ).bind(partner_id).fetch_all(pool).await?;
    Ok(contacts)
}

pub async fn get_agreements(pool: &PgPool, partner_id: Uuid) -> Result<Vec<PartnershipAgreement>, AppError> {
    let agreements = sqlx::query_as::<_, PartnershipAgreement>(
        "SELECT * FROM partnership_agreements WHERE partner_id = $1 AND deleted_at IS NULL ORDER BY start_date DESC"
    ).bind(partner_id).fetch_all(pool).await?;
    Ok(agreements)
}
