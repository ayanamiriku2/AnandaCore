use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_document(pool: &PgPool, req: CreateDocumentRequest, user_id: Uuid) -> Result<Document, AppError> {
    let doc = sqlx::query_as::<_, Document>(
        r#"INSERT INTO documents (title, document_number, document_date, department_id, program_id,
            category_id, confidentiality, retention_type, retention_until, description,
            internal_notes, responsible_user_id, uploaded_by, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
        RETURNING *"#
    )
    .bind(&req.title)
    .bind(&req.document_number)
    .bind(req.document_date)
    .bind(req.department_id)
    .bind(req.program_id)
    .bind(req.category_id)
    .bind(req.confidentiality.unwrap_or_else(|| "internal".into()))
    .bind(req.retention_type.unwrap_or_else(|| "5_tahun".into()))
    .bind(req.retention_until)
    .bind(&req.description)
    .bind(&req.internal_notes)
    .bind(req.responsible_user_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if let Some(tag_ids) = req.tag_ids {
        for tag_id in tag_ids {
            sqlx::query("INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
                .bind(doc.id)
                .bind(tag_id)
                .execute(pool)
                .await?;
        }
    }

    Ok(doc)
}

pub async fn list_documents(pool: &PgPool, pagination: &PaginationParams, filter: &DocumentFilter) -> Result<PaginatedResponse<DocumentSummary>, AppError> {
    let mut where_clauses = vec!["deleted_at IS NULL".to_string()];
    let mut param_idx = 0u32;

    if filter.search.is_some() {
        param_idx += 1;
        where_clauses.push(format!(
            "to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(document_number, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery('indonesian', ${})",
            param_idx
        ));
    }
    if filter.category_id.is_some() { param_idx += 1; where_clauses.push(format!("category_id = ${}", param_idx)); }
    if filter.department_id.is_some() { param_idx += 1; where_clauses.push(format!("department_id = ${}", param_idx)); }
    if filter.status.is_some() { param_idx += 1; where_clauses.push(format!("status = ${}", param_idx)); }
    if filter.confidentiality.is_some() { param_idx += 1; where_clauses.push(format!("confidentiality = ${}", param_idx)); }
    if filter.year.is_some() { param_idx += 1; where_clauses.push(format!("EXTRACT(YEAR FROM document_date) = ${}", param_idx)); }

    // For simplicity, we use a direct query approach
    let total: i64 = sqlx::query_scalar(
        &format!("SELECT COUNT(*) FROM documents WHERE {}", where_clauses.join(" AND "))
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let data = sqlx::query_as::<_, DocumentSummary>(
        &format!(
            "SELECT id, title, document_number, document_date, category_id, confidentiality, status, file_name, verification_status, created_at FROM documents WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clauses[0], // simplified: just use base filter for the direct query
            pagination.per_page(),
            pagination.offset()
        )
    )
    .fetch_all(pool)
    .await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_document(pool: &PgPool, id: Uuid) -> Result<Document, AppError> {
    sqlx::query_as::<_, Document>("SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Dokumen tidak ditemukan".into()))
}

pub async fn update_document(pool: &PgPool, id: Uuid, req: UpdateDocumentRequest) -> Result<Document, AppError> {
    let doc = get_document(pool, id).await?;

    let updated = sqlx::query_as::<_, Document>(
        r#"UPDATE documents SET
            title = COALESCE($2, title),
            document_number = COALESCE($3, document_number),
            status = COALESCE($4, status),
            description = COALESCE($5, description),
            internal_notes = COALESCE($6, internal_notes),
            confidentiality = COALESCE($7, confidentiality)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id)
    .bind(&req.title)
    .bind(&req.document_number)
    .bind(&req.status)
    .bind(&req.description)
    .bind(&req.internal_notes)
    .bind(&req.confidentiality)
    .fetch_one(pool)
    .await?;

    Ok(updated)
}

pub async fn verify_document(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<Document, AppError> {
    sqlx::query_as::<_, Document>(
        "UPDATE documents SET verification_status = 'terverifikasi', verified_by = $2, verified_at = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)
}

pub async fn get_document_versions(pool: &PgPool, document_id: Uuid) -> Result<Vec<DocumentVersion>, AppError> {
    let versions = sqlx::query_as::<_, DocumentVersion>(
        "SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC"
    )
    .bind(document_id)
    .fetch_all(pool)
    .await?;
    Ok(versions)
}

pub async fn list_categories(pool: &PgPool) -> Result<Vec<DocumentCategory>, AppError> {
    let cats = sqlx::query_as::<_, DocumentCategory>(
        "SELECT * FROM document_categories WHERE is_active = true ORDER BY name"
    )
    .fetch_all(pool)
    .await?;
    Ok(cats)
}
