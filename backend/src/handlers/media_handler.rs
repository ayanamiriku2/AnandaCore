use axum::{
    extract::{Multipart, Path, Query, State},
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::PaginationParams,
    errors::AppError,
    middleware::auth_middleware::CurrentUser,
    models::*,
    services::media_service,
    storage::StorageService,
    AppState,
};

pub async fn list_albums(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = media_service::list_albums(&state.db, &params).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get_album(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;
    Ok(Json(serde_json::json!({"album": album, "assets": assets})))
}

/// Public endpoint - no auth required
pub async fn get_album_public(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;
    Ok(Json(serde_json::json!({"album": album, "assets": assets})))
}

pub async fn create_album(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateAlbumRequest>,
) -> Result<Json<MediaAlbum>, AppError> {
    Ok(Json(media_service::create_album(&state.db, req, current.id).await?))
}

pub async fn update_album(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateAlbumRequest>,
) -> Result<Json<MediaAlbum>, AppError> {
    Ok(Json(media_service::update_album(&state.db, id, req).await?))
}

pub async fn soft_delete_album(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    media_service::soft_delete_album(&state.db, id).await?;
    Ok(Json(serde_json::json!({"message": "Album berhasil dihapus"})))
}

pub async fn restore_album(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<MediaAlbum>, AppError> {
    Ok(Json(media_service::restore_album(&state.db, id).await?))
}

pub async fn list_assets(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<MediaFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = media_service::list_assets(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn upload_asset(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(album_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<MediaAsset>, AppError> {
    // Verify album exists
    media_service::get_album(&state.db, album_id).await?;

    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut title: Option<String> = None;
    let mut description: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                content_type = field.content_type().map(|s| s.to_string());
                let bytes = field.bytes().await
                    .map_err(|e| AppError::BadRequest(format!("Gagal membaca file: {}", e)))?;
                file_data = Some(bytes.to_vec());
            }
            "title" => {
                let text = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Gagal membaca field title: {}", e)))?;
                if !text.is_empty() {
                    title = Some(text);
                }
            }
            "description" => {
                let text = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Gagal membaca field description: {}", e)))?;
                if !text.is_empty() {
                    description = Some(text);
                }
            }
            _ => {
                // skip unknown fields
            }
        }
    }

    let data = file_data.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;
    let mime = content_type.unwrap_or_else(|| "application/octet-stream".to_string());

    if !StorageService::validate_file_type(&mime) {
        return Err(AppError::Validation(format!("Tipe file '{}' tidak diizinkan", mime)));
    }

    if data.len() > state.config.max_upload_size {
        return Err(AppError::Validation("Ukuran file melebihi batas maksimum".into()));
    }

    let original_name = file_name.clone().unwrap_or_else(|| "file".to_string());
    let key = StorageService::generate_key("media", &original_name);

    state.storage.upload(&key, data.clone(), &mime).await
        .map_err(|e| AppError::Internal(format!("Gagal upload file: {}", e)))?;

    let media_type = if mime.starts_with("image/") {
        "image"
    } else if mime.starts_with("video/") {
        "video"
    } else if mime.starts_with("audio/") {
        "audio"
    } else {
        "document"
    };

    let asset = media_service::create_asset(
        &state.db,
        album_id,
        title,
        description,
        media_type,
        &key,
        file_name,
        data.len() as i64,
        Some(mime),
        current.id,
    ).await?;

    Ok(Json(asset))
}

pub async fn delete_asset(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let asset = media_service::get_asset(&state.db, id).await?;

    media_service::soft_delete_asset(&state.db, id).await?;

    // Remove from S3
    let _ = state.storage.delete(&asset.file_path).await;

    Ok(Json(serde_json::json!({"message": "Aset media berhasil dihapus"})))
}
