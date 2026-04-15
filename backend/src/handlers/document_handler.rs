use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::header,
    response::{IntoResponse, Response},
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::PaginationParams,
    errors::AppError,
    middleware::auth_middleware::CurrentUser,
    models::*,
    services::{document_service, audit_service},
    storage::StorageService,
    upload_stream::stream_field_to_storage,
    AppState,
};

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<DocumentFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = document_service::list_documents(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::get_document(&state.db, id).await?;
    Ok(Json(doc))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateDocumentRequest>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::create_document(&state.db, req, current.id).await?;
    let _ = audit_service::create_audit_log(
        &state.db, Some(current.id), "create", "documents",
        Some("document"), Some(doc.id), None,
        Some(serde_json::json!({"title": doc.title})), None,
    ).await;
    Ok(Json(doc))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateDocumentRequest>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::update_document(&state.db, id, req).await?;
    Ok(Json(doc))
}

pub async fn verify(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<Document>, AppError> {
    let doc = document_service::verify_document(&state.db, id, current.id).await?;
    Ok(Json(doc))
}

pub async fn versions(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<DocumentVersion>>, AppError> {
    let versions = document_service::get_document_versions(&state.db, id).await?;
    Ok(Json(versions))
}

pub async fn categories(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<DocumentCategory>>, AppError> {
    let cats = document_service::list_categories(&state.db).await?;
    Ok(Json(cats))
}

pub async fn upload_file(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Path(id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<Document>, AppError> {
    // Ensure the document exists
    let _doc = document_service::get_document(&state.db, id).await?;

    let mut file_size: Option<i64> = None;
    let mut file_name: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut stored_key: Option<String> = None;
    let mut change_notes: Option<String> = None;

    while let Some(mut field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Gagal membaca multipart: {}", e)))?
    {
        let field_name = field.name().unwrap_or("").to_string();
        match field_name.as_str() {
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                content_type = field.content_type().map(|s| s.to_string());
                let mime = content_type
                    .clone()
                    .unwrap_or_else(|| "application/octet-stream".to_string());
                if !StorageService::validate_file_type(&mime) {
                    return Err(AppError::Validation(format!(
                        "Tipe file '{}' tidak diizinkan",
                        mime
                    )));
                }

                let current_file_name = file_name.clone().unwrap_or_else(|| "document.bin".to_string());
                let key = StorageService::generate_key("documents", &current_file_name);
                file_size = Some(
                    stream_field_to_storage(
                        &mut field,
                        &state.storage,
                        &key,
                        &mime,
                        state.config.max_upload_size,
                    )
                    .await?,
                );
                stored_key = Some(key);
                file_name = Some(current_file_name);
                content_type = Some(mime);
            }
            "change_notes" => {
                change_notes = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(format!("Gagal membaca field: {}", e)))?,
                );
            }
            _ => {}
        }
    }

    let file_name = file_name.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;
    let mime = content_type.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;
    let file_size = file_size.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;
    let stored_key = stored_key.ok_or_else(|| AppError::Validation("Field 'file' wajib diisi".into()))?;

    // Get next version number
    let next_version: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(version_number), 0) + 1 FROM document_versions WHERE document_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    // Create version record
    sqlx::query(
        r#"INSERT INTO document_versions (document_id, version_number, file_path, file_name, file_size, file_mime, change_notes, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"#,
    )
    .bind(id)
    .bind(next_version)
    .bind(&stored_key)
    .bind(&file_name)
    .bind(file_size)
    .bind(&mime)
    .bind(&change_notes)
    .bind(current.id)
    .execute(&state.db)
    .await?;

    // Update document with file info and current version
    let doc = sqlx::query_as::<_, Document>(
        r#"UPDATE documents SET
            file_path = $2,
            file_name = $3,
            file_size = $4,
            file_mime = $5,
            current_version = $6,
            updated_at = NOW()
        WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(&stored_key)
    .bind(&file_name)
    .bind(file_size)
    .bind(&mime)
    .bind(next_version)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(doc))
}

pub async fn download_file(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Response, AppError> {
    let doc = document_service::get_document(&state.db, id).await?;

    let file_path = doc
        .file_path
        .ok_or_else(|| AppError::NotFound("Dokumen belum memiliki file".into()))?;

    let data = state
        .storage
        .download(&file_path)
        .await
        .map_err(|e| AppError::Internal(format!("Gagal mengunduh file: {}", e)))?;

    let file_name = doc.file_name.unwrap_or_else(|| "document".to_string());
    let mime = doc
        .file_mime
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let response = Response::builder()
        .header(header::CONTENT_TYPE, &mime)
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", file_name),
        )
        .body(Body::from(data))
        .map_err(|e| AppError::Internal(format!("Gagal membuat response: {}", e)))?;

    Ok(response)
}

pub async fn soft_delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Verify document exists and is not already deleted
    let _doc = document_service::get_document(&state.db, id).await?;

    sqlx::query("UPDATE documents SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "message": "Dokumen berhasil dihapus" })))
}

pub async fn restore(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Document>, AppError> {
    // Fetch even if soft-deleted
    let doc = sqlx::query_as::<_, Document>("SELECT * FROM documents WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Dokumen tidak ditemukan".into()))?;

    if doc.deleted_at.is_none() {
        return Err(AppError::BadRequest("Dokumen tidak dalam status terhapus".into()));
    }

    let restored = sqlx::query_as::<_, Document>(
        "UPDATE documents SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(restored))
}
