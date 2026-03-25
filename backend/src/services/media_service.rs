use sqlx::PgPool;
use uuid::Uuid;
use crate::{db::*, errors::AppError, models::*};

pub async fn list_albums(pool: &PgPool, pagination: &PaginationParams) -> Result<PaginatedResponse<MediaAlbum>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM media_albums WHERE deleted_at IS NULL")
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, MediaAlbum>(
        "SELECT * FROM media_albums WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    ).bind(pagination.per_page()).bind(pagination.offset()).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_album(pool: &PgPool, id: Uuid) -> Result<MediaAlbum, AppError> {
    sqlx::query_as::<_, MediaAlbum>("SELECT * FROM media_albums WHERE id = $1 AND deleted_at IS NULL")
        .bind(id).fetch_optional(pool).await?
        .ok_or_else(|| AppError::NotFound("Album tidak ditemukan".into()))
}

pub async fn create_album(pool: &PgPool, req: CreateAlbumRequest, user_id: Uuid) -> Result<MediaAlbum, AppError> {
    let album = sqlx::query_as::<_, MediaAlbum>(
        "INSERT INTO media_albums (title, description, activity_id, program_id, album_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
    ).bind(&req.title).bind(&req.description).bind(req.activity_id).bind(req.program_id).bind(req.album_date).bind(user_id)
    .fetch_one(pool).await?;
    Ok(album)
}

pub async fn get_album_assets(pool: &PgPool, album_id: Uuid) -> Result<Vec<MediaAsset>, AppError> {
    let data = sqlx::query_as::<_, MediaAsset>(
        "SELECT * FROM media_assets WHERE album_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC"
    ).bind(album_id).fetch_all(pool).await?;
    Ok(data)
}

pub async fn list_assets(pool: &PgPool, pagination: &PaginationParams, filter: &MediaFilter) -> Result<PaginatedResponse<MediaAsset>, AppError> {
    let mut conditions = vec!["deleted_at IS NULL".to_string()];
    if let Some(ref mt) = filter.media_type { conditions.push(format!("media_type = '{}'", mt)); }
    if let Some(aid) = filter.album_id { conditions.push(format!("album_id = '{}'", aid)); }
    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM media_assets WHERE {}", where_clause))
        .fetch_one(pool).await.unwrap_or(0);
    let data = sqlx::query_as::<_, MediaAsset>(
        &format!("SELECT * FROM media_assets WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset())
    ).fetch_all(pool).await?;
    Ok(PaginatedResponse::new(data, total, pagination))
}
