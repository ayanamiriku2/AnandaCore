use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use std::io::{Write, Cursor};
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
    Query(filter): Query<AlbumListFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = media_service::list_albums(&state.db, &params, filter.parent_id).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get_album(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;
    let sub_albums = media_service::list_albums(&state.db, &PaginationParams { page: None, per_page: Some(100) }, Some(id)).await?;
    let breadcrumbs = media_service::get_album_breadcrumbs(&state.db, id).await?;
    Ok(Json(serde_json::json!({"album": album, "assets": assets, "sub_albums": sub_albums.data, "breadcrumbs": breadcrumbs})))
}

/// Public endpoint - no auth required
pub async fn get_album_public(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;
    let sub_albums = media_service::list_albums(&state.db, &PaginationParams { page: None, per_page: Some(100) }, Some(id)).await?;
    let breadcrumbs = media_service::get_album_breadcrumbs(&state.db, id).await?;
    Ok(Json(serde_json::json!({"album": album, "assets": assets, "sub_albums": sub_albums.data, "breadcrumbs": breadcrumbs})))
}

/// Public endpoint - download all album assets as ZIP
pub async fn download_album_zip(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Response, AppError> {
    let album = media_service::get_album(&state.db, id).await?;
    let assets = media_service::get_album_assets(&state.db, id).await?;

    if assets.is_empty() {
        return Err(AppError::BadRequest("Album tidak memiliki file".into()));
    }

    let buf = Cursor::new(Vec::new());
    let mut zip_writer = zip::ZipWriter::new(buf);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let mut used_names = std::collections::HashSet::new();

    for asset in &assets {
        let base_name = asset.file_name
            .clone()
            .unwrap_or_else(|| asset.file_path.split('/').last().unwrap_or("file").to_string());

        // Deduplicate filenames
        let mut name = base_name.clone();
        let mut counter = 1u32;
        while used_names.contains(&name) {
            let stem = std::path::Path::new(&base_name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("file");
            let ext = std::path::Path::new(&base_name)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("bin");
            name = format!("{}_{}.{}", stem, counter, ext);
            counter += 1;
        }
        used_names.insert(name.clone());

        match state.storage.download(&asset.file_path).await {
            Ok(data) => {
                if zip_writer.start_file(&name, options).is_ok() {
                    let _ = zip_writer.write_all(&data);
                }
            }
            Err(_) => continue,
        }
    }

    let cursor = zip_writer.finish()
        .map_err(|e| AppError::Internal(format!("Gagal membuat ZIP: {}", e)))?;
    let zip_bytes = cursor.into_inner();

    let safe_title = album.title
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' })
        .collect::<String>();

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/zip")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}.zip\"", safe_title),
        )
        .header(header::CONTENT_LENGTH, zip_bytes.len())
        .body(Body::from(zip_bytes))
        .unwrap())
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
