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
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR partner_type = $1) \
         AND ($2::text IS NULL OR pipeline_status = $2) \
         AND ($3::text IS NULL OR city = $3) \
         AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%')"
    )
    .bind(&filter.partner_type)
    .bind(&filter.pipeline_status)
    .bind(&filter.city)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Partner>(
        "SELECT * FROM partners WHERE deleted_at IS NULL \
         AND ($1::text IS NULL OR partner_type = $1) \
         AND ($2::text IS NULL OR pipeline_status = $2) \
         AND ($3::text IS NULL OR city = $3) \
         AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%') \
         ORDER BY created_at DESC LIMIT $5 OFFSET $6"
    )
    .bind(&filter.partner_type)
    .bind(&filter.pipeline_status)
    .bind(&filter.city)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

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
            pipeline_status = COALESCE($4, pipeline_status), internal_notes = COALESCE($5, internal_notes),
            relationship_status = COALESCE($6, relationship_status), phone = COALESCE($7, phone),
            email = COALESCE($8, email), website = COALESCE($9, website)
        WHERE id = $1 AND deleted_at IS NULL RETURNING *"#
    )
    .bind(id).bind(&req.name).bind(&req.partner_type)
    .bind(&req.pipeline_status).bind(&req.internal_notes)
    .bind(&req.relationship_status).bind(&req.phone)
    .bind(&req.email).bind(&req.website)
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
