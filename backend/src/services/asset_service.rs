use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_asset(pool: &PgPool, req: CreateAssetRequest, user_id: Uuid) -> Result<Asset, AppError> {
    let asset = sqlx::query_as::<_, Asset>(
        r#"INSERT INTO assets (name, asset_code, category_id, location_id, department_id,
            responsible_user_id, acquisition_date, acquisition_value, condition, description, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *"#
    )
    .bind(&req.name).bind(&req.asset_code).bind(req.category_id)
    .bind(req.location_id).bind(req.department_id).bind(req.responsible_user_id)
    .bind(req.acquisition_date).bind(req.acquisition_value)
    .bind(req.condition.unwrap_or_else(|| "baik".into()))
    .bind(&req.description).bind(&req.notes).bind(user_id)
    .fetch_one(pool).await?;
    Ok(asset)
}

pub async fn list_assets(pool: &PgPool, pagination: &PaginationParams, filter: &AssetFilter) -> Result<PaginatedResponse<Asset>, AppError> {
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM assets WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR category_id = $1) \
         AND ($2::uuid IS NULL OR location_id = $2) \
         AND ($3::text IS NULL OR condition = $3) \
         AND ($4::text IS NULL OR status = $4) \
         AND ($5::text IS NULL OR name ILIKE '%' || $5 || '%' OR asset_code ILIKE '%' || $5 || '%' OR description ILIKE '%' || $5 || '%')"
    )
    .bind(filter.category_id)
    .bind(filter.location_id)
    .bind(&filter.condition)
    .bind(&filter.status)
    .bind(&filter.search)
    .fetch_one(pool).await.unwrap_or(0);

    let data = sqlx::query_as::<_, Asset>(
        "SELECT * FROM assets WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR category_id = $1) \
         AND ($2::uuid IS NULL OR location_id = $2) \
         AND ($3::text IS NULL OR condition = $3) \
         AND ($4::text IS NULL OR status = $4) \
         AND ($5::text IS NULL OR name ILIKE '%' || $5 || '%' OR asset_code ILIKE '%' || $5 || '%' OR description ILIKE '%' || $5 || '%') \
         ORDER BY name LIMIT $6 OFFSET $7"
    )
    .bind(filter.category_id)
    .bind(filter.location_id)
    .bind(&filter.condition)
    .bind(&filter.status)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
    .fetch_all(pool).await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_asset(pool: &PgPool, id: Uuid) -> Result<Asset, AppError> {
    sqlx::query_as::<_, Asset>("SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Aset tidak ditemukan".into()))
}

pub async fn update_asset(pool: &PgPool, id: Uuid, req: UpdateAssetRequest) -> Result<Asset, AppError> {
    sqlx::query_as::<_, Asset>(
        r#"UPDATE assets SET name = COALESCE($2, name), condition = COALESCE($3, condition),
            status = COALESCE($4, status), responsible_user_id = COALESCE($5, responsible_user_id),
            location_id = COALESCE($6, location_id), notes = COALESCE($7, notes),
            next_maintenance_date = COALESCE($8, next_maintenance_date)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id).bind(&req.name).bind(&req.condition).bind(&req.status)
    .bind(req.responsible_user_id).bind(req.location_id).bind(&req.notes)
    .bind(req.next_maintenance_date)
    .fetch_one(pool).await.map_err(AppError::from)
}

pub async fn delete_asset(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE assets SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
