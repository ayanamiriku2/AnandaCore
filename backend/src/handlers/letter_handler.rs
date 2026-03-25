use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::PaginationParams,
    errors::AppError,
    middleware::auth_middleware::CurrentUser,
    models::*,
    services::letter_service,
    storage::StorageService,
    AppState,
};

#[derive(Debug, Serialize, FromRow)]
pub struct LetterAttachment {
    pub id: Uuid,
    pub letter_id: Uuid,
    pub title: Option<String>,
    pub file_path: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub file_mime: Option<String>,
    pub uploaded_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<LetterFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = letter_service::list_letters(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::get_letter(&state.db, id).await?;
    Ok(Json(letter))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateLetterRequest>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::create_letter(&state.db, req, current.id).await?;
    Ok(Json(letter))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateLetterRequest>,
) -> Result<Json<Letter>, AppError> {
    let letter = letter_service::update_letter(&state.db, id, req).await?;
    Ok(Json(letter))
}

pub async fn create_disposition(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(letter_id): Path<Uuid>,
    Json(req): Json<CreateDispositionRequest>,
) -> Result<Json<LetterDisposition>, AppError> {
    let disp = letter_service::create_disposition(&state.db, letter_id, req, current.id).await?;
    Ok(Json(disp))
}

pub async fn get_dispositions(
    State(state): State<Arc<AppState>>,
    Path(letter_id): Path<Uuid>,
) -> Result<Json<Vec<LetterDisposition>>, AppError> {
    let disps = letter_service::get_dispositions(&state.db, letter_id).await?;
    Ok(Json(disps))
}

pub async fn upload_attachment(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(letter_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<LetterAttachment>), AppError> {
    // Verify the letter exists
    let _letter = letter_service::get_letter(&state.db, letter_id).await?;

    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut title: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();
        match field_name.as_str() {
            "file" => {
                file_name = field.file_name().map(|f| f.to_string());
                content_type = field.content_type().map(|c| c.to_string());
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
            _ => {}
        }
    }

    let data = file_data.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;
    let name = file_name.unwrap_or_else(|| "attachment".to_string());
    let mime = content_type.unwrap_or_else(|| "application/octet-stream".to_string());

    if !StorageService::validate_file_type(&mime) {
        return Err(AppError::Validation(format!("Tipe file '{}' tidak diizinkan", mime)));
    }

    if data.len() > state.config.max_upload_size {
        return Err(AppError::Validation("Ukuran file melebihi batas maksimum".into()));
    }

    let file_size = data.len() as i64;
    let key = StorageService::generate_key("letters", &name);

    state.storage.upload(&key, data, &mime).await
        .map_err(|e| AppError::Internal(format!("Gagal upload: {}", e)))?;

    let attachment = sqlx::query_as::<_, LetterAttachment>(
        r#"INSERT INTO letter_attachments (letter_id, title, file_path, file_name, file_size, file_mime, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, letter_id, title, file_path, file_name, file_size, file_mime, uploaded_by, created_at"#
    )
    .bind(letter_id)
    .bind(&title)
    .bind(&key)
    .bind(&name)
    .bind(file_size)
    .bind(&mime)
    .bind(current.id)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(attachment)))
}

pub async fn get_attachments(
    State(state): State<Arc<AppState>>,
    Path(letter_id): Path<Uuid>,
) -> Result<Json<Vec<LetterAttachment>>, AppError> {
    let attachments = sqlx::query_as::<_, LetterAttachment>(
        r#"SELECT id, letter_id, title, file_path, file_name, file_size, file_mime, uploaded_by, created_at
           FROM letter_attachments
           WHERE letter_id = $1
           ORDER BY created_at DESC"#
    )
    .bind(letter_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(attachments))
}

pub async fn download_attachment(
    State(state): State<Arc<AppState>>,
    Path(attachment_id): Path<Uuid>,
) -> Result<Response, AppError> {
    let attachment = sqlx::query_as::<_, LetterAttachment>(
        r#"SELECT id, letter_id, title, file_path, file_name, file_size, file_mime, uploaded_by, created_at
           FROM letter_attachments
           WHERE id = $1"#
    )
    .bind(attachment_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Lampiran tidak ditemukan".into()))?;

    let data = state.storage.download(&attachment.file_path).await
        .map_err(|e| AppError::NotFound(format!("File tidak ditemukan: {}", e)))?;

    let content_type = attachment.file_mime
        .unwrap_or_else(|| "application/octet-stream".to_string());
    let download_name = attachment.file_name
        .unwrap_or_else(|| "attachment".to_string());

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", download_name))
        .body(Body::from(data))
        .unwrap())
}

pub async fn soft_delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query(
        "UPDATE letters SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Surat tidak ditemukan atau sudah dihapus".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query(
        "UPDATE letters SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Surat tidak ditemukan atau belum dihapus".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}
