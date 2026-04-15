use axum::{
    body::Body,
    extract::{Multipart, Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::io::AsyncWriteExt;
use crate::{errors::AppError, middleware::auth_middleware::CurrentUser, storage::StorageService, AppState};

pub async fn upload(
    State(state): State<Arc<AppState>>,
    axum::Extension(_current): axum::Extension<CurrentUser>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut uploaded = Vec::new();

    while let Ok(Some(mut field)) = multipart.next_field().await {
        let module = field.name().unwrap_or("general").to_string();
        let file_name = field.file_name().unwrap_or("file").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        if !StorageService::validate_file_type(&content_type) {
            return Err(AppError::Validation(format!("Tipe file '{}' tidak diizinkan", content_type)));
        }

        let path: PathBuf = std::env::temp_dir().join(format!("anandacore-upload-{}", uuid::Uuid::new_v4()));
        let mut tmp = tokio::fs::File::create(&path)
            .await
            .map_err(|e| AppError::Internal(format!("Gagal membuat file sementara: {}", e)))?;

        let mut total_size: usize = 0;
        while let Some(chunk) = field
            .chunk()
            .await
            .map_err(|e| AppError::BadRequest(format!("Gagal membaca file: {}", e)))?
        {
            total_size += chunk.len();
            if total_size > state.config.max_upload_size {
                let _ = tokio::fs::remove_file(&path).await;
                return Err(AppError::Validation("Ukuran file melebihi batas maksimum".into()));
            }

            tmp.write_all(&chunk)
                .await
                .map_err(|e| AppError::Internal(format!("Gagal menulis file sementara: {}", e)))?;
        }

        tmp.flush()
            .await
            .map_err(|e| AppError::Internal(format!("Gagal flush file sementara: {}", e)))?;

        let key = StorageService::generate_key(&module, &file_name);
        let upload_result = state.storage.upload_from_path(&key, &path, &content_type).await;
        let _ = tokio::fs::remove_file(&path).await;
        upload_result.map_err(|e| AppError::Internal(format!("Gagal upload: {}", e)))?;

        uploaded.push(serde_json::json!({
            "key": key,
            "file_name": file_name,
            "content_type": content_type,
            "size": total_size,
        }));
    }

    Ok(Json(serde_json::json!({"files": uploaded})))
}

pub async fn download(
    State(state): State<Arc<AppState>>,
    Path(key): Path<String>,
) -> Result<Response, AppError> {
    let data = state.storage.download(&key).await
        .map_err(|e| AppError::NotFound(format!("File tidak ditemukan: {}", e)))?;

    let content_type = mime_guess::from_path(&key)
        .first_or_octet_stream()
        .to_string();

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CONTENT_DISPOSITION, format!("inline; filename=\"{}\"", key.split('/').last().unwrap_or(&key)))
        .body(Body::from(data))
        .unwrap())
}
