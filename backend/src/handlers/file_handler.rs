use axum::{
    body::Body,
    extract::{Multipart, Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use std::sync::Arc;
use crate::{errors::AppError, middleware::auth_middleware::CurrentUser, storage::StorageService, upload_stream::stream_field_to_storage, AppState};

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

        let key = StorageService::generate_key(&module, &file_name);
        let total_size = stream_field_to_storage(
            &mut field,
            &state.storage,
            &key,
            &content_type,
            state.config.max_upload_size,
        )
        .await?;

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
    let byte_stream = state.storage.get_object_stream(&key).await
        .map_err(|e| AppError::NotFound(format!("File tidak ditemukan: {}", e)))?;

    let content_type = mime_guess::from_path(&key)
        .first_or_octet_stream()
        .to_string();

    let filename = key.split('/').last().unwrap_or(&key);

    // Convert ByteStream to streaming body using ReaderStream
    let async_read = byte_stream.into_async_read();
    let stream = tokio_util::io::ReaderStream::new(async_read);
    let body = Body::from_stream(stream);

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CONTENT_DISPOSITION, format!("inline; filename=\"{}\"", filename))
        .body(body)
        .unwrap())
}
