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

pub async fn create_asset(
    pool: &PgPool,
    album_id: Uuid,
    title: Option<String>,
    description: Option<String>,
    media_type: &str,
    file_path: &str,
    file_name: Option<String>,
    file_size: i64,
    file_mime: Option<String>,
    uploaded_by: Uuid,
) -> Result<MediaAsset, AppError> {
    let asset = sqlx::query_as::<_, MediaAsset>(
        "INSERT INTO media_assets (album_id, title, description, media_type, file_path, file_name, file_size, file_mime, uploaded_by, upload_status) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed') RETURNING *"
    )
    .bind(album_id)
    .bind(&title)
    .bind(&description)
    .bind(media_type)
    .bind(file_path)
    .bind(&file_name)
    .bind(file_size)
    .bind(&file_mime)
    .bind(uploaded_by)
    .fetch_one(pool)
    .await?;
    Ok(asset)
}

pub async fn get_asset(pool: &PgPool, id: Uuid) -> Result<MediaAsset, AppError> {
    sqlx::query_as::<_, MediaAsset>("SELECT * FROM media_assets WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Aset media tidak ditemukan".into()))
}

pub async fn soft_delete_asset(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("UPDATE media_assets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Aset media tidak ditemukan".into()));
    }
    Ok(())
}

pub async fn update_album(pool: &PgPool, id: Uuid, req: UpdateAlbumRequest) -> Result<MediaAlbum, AppError> {
    let album = sqlx::query_as::<_, MediaAlbum>(
        "UPDATE media_albums SET \
         title = COALESCE($2, title), \
         description = COALESCE($3, description), \
         updated_at = NOW() \
         WHERE id = $1 AND deleted_at IS NULL RETURNING *"
    )
    .bind(id)
    .bind(&req.title)
    .bind(&req.description)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Album tidak ditemukan".into()))?;
    Ok(album)
}

pub async fn soft_delete_album(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("UPDATE media_albums SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Album tidak ditemukan".into()));
    }
    Ok(())
}

pub async fn restore_album(pool: &PgPool, id: Uuid) -> Result<MediaAlbum, AppError> {
    let album = sqlx::query_as::<_, MediaAlbum>(
        "UPDATE media_albums SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Album tidak ditemukan atau belum dihapus".into()))?;
    Ok(album)
}
