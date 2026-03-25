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
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR category_id = $1) \
         AND ($2::uuid IS NULL OR department_id = $2) \
         AND ($3::uuid IS NULL OR program_id = $3) \
         AND ($4::text IS NULL OR status = $4) \
         AND ($5::text IS NULL OR confidentiality = $5) \
         AND ($6::int4 IS NULL OR EXTRACT(YEAR FROM document_date)::int4 = $6) \
         AND ($7::text IS NULL OR verification_status = $7) \
         AND ($8::text IS NULL OR title ILIKE '%' || $8 || '%' OR document_number ILIKE '%' || $8 || '%' OR description ILIKE '%' || $8 || '%')"
    )
    .bind(filter.category_id)
    .bind(filter.department_id)
    .bind(filter.program_id)
    .bind(&filter.status)
    .bind(&filter.confidentiality)
    .bind(filter.year)
    .bind(&filter.verification_status)
    .bind(&filter.search)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let data = sqlx::query_as::<_, DocumentSummary>(
        "SELECT id, title, document_number, document_date, category_id, confidentiality, status, file_name, verification_status, created_at \
         FROM documents WHERE deleted_at IS NULL \
         AND ($1::uuid IS NULL OR category_id = $1) \
         AND ($2::uuid IS NULL OR department_id = $2) \
         AND ($3::uuid IS NULL OR program_id = $3) \
         AND ($4::text IS NULL OR status = $4) \
         AND ($5::text IS NULL OR confidentiality = $5) \
         AND ($6::int4 IS NULL OR EXTRACT(YEAR FROM document_date)::int4 = $6) \
         AND ($7::text IS NULL OR verification_status = $7) \
         AND ($8::text IS NULL OR title ILIKE '%' || $8 || '%' OR document_number ILIKE '%' || $8 || '%' OR description ILIKE '%' || $8 || '%') \
         ORDER BY created_at DESC LIMIT $9 OFFSET $10"
    )
    .bind(filter.category_id)
    .bind(filter.department_id)
    .bind(filter.program_id)
    .bind(&filter.status)
    .bind(&filter.confidentiality)
    .bind(filter.year)
    .bind(&filter.verification_status)
    .bind(&filter.search)
    .bind(pagination.per_page())
    .bind(pagination.offset())
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
    let _doc = get_document(pool, id).await?;

    let updated = sqlx::query_as::<_, Document>(
        r#"UPDATE documents SET
            title = COALESCE($2, title),
            document_number = COALESCE($3, document_number),
            document_date = COALESCE($4, document_date),
            department_id = COALESCE($5, department_id),
            program_id = COALESCE($6, program_id),
            category_id = COALESCE($7, category_id),
            confidentiality = COALESCE($8, confidentiality),
            status = COALESCE($9, status),
            retention_type = COALESCE($10, retention_type),
            retention_until = COALESCE($11, retention_until),
            description = COALESCE($12, description),
            internal_notes = COALESCE($13, internal_notes),
            responsible_user_id = COALESCE($14, responsible_user_id),
            updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL RETURNING *"#
    )
    .bind(id)
    .bind(&req.title)
    .bind(&req.document_number)
    .bind(req.document_date)
    .bind(req.department_id)
    .bind(req.program_id)
    .bind(req.category_id)
    .bind(&req.confidentiality)
    .bind(&req.status)
    .bind(&req.retention_type)
    .bind(req.retention_until)
    .bind(&req.description)
    .bind(&req.internal_notes)
    .bind(req.responsible_user_id)
    .fetch_one(pool)
    .await?;

    if let Some(tag_ids) = req.tag_ids {
        sqlx::query("DELETE FROM document_tags WHERE document_id = $1")
            .bind(id).execute(pool).await?;
        for tag_id in tag_ids {
            sqlx::query("INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
                .bind(id).bind(tag_id).execute(pool).await?;
        }
    }

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
