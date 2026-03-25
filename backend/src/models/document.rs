use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub document_number: Option<String>,
    pub document_date: Option<NaiveDate>,
    pub archive_date: Option<NaiveDate>,
    pub department_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub confidentiality: String,
    pub status: String,
    pub retention_type: Option<String>,
    pub retention_until: Option<NaiveDate>,
    pub custom_review_date: Option<NaiveDate>,
    pub description: Option<String>,
    pub internal_notes: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub file_mime: Option<String>,
    pub thumbnail_path: Option<String>,
    pub current_version: Option<i32>,
    pub verification_status: Option<String>,
    pub verified_by: Option<Uuid>,
    pub verified_at: Option<DateTime<Utc>>,
    pub uploaded_by: Option<Uuid>,
    pub responsible_user_id: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct DocumentSummary {
    pub id: Uuid,
    pub title: String,
    pub document_number: Option<String>,
    pub document_date: Option<NaiveDate>,
    pub category_id: Option<Uuid>,
    pub confidentiality: String,
    pub status: String,
    pub file_name: Option<String>,
    pub verification_status: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub document_number: Option<String>,
    pub document_date: Option<NaiveDate>,
    pub department_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub confidentiality: Option<String>,
    pub retention_type: Option<String>,
    pub retention_until: Option<NaiveDate>,
    pub description: Option<String>,
    pub internal_notes: Option<String>,
    pub responsible_user_id: Option<Uuid>,
    pub tag_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDocumentRequest {
    pub title: Option<String>,
    pub document_number: Option<String>,
    pub document_date: Option<NaiveDate>,
    pub department_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub confidentiality: Option<String>,
    pub status: Option<String>,
    pub retention_type: Option<String>,
    pub retention_until: Option<NaiveDate>,
    pub description: Option<String>,
    pub internal_notes: Option<String>,
    pub responsible_user_id: Option<Uuid>,
    pub tag_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct DocumentFilter {
    pub search: Option<String>,
    pub category_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub status: Option<String>,
    pub confidentiality: Option<String>,
    pub year: Option<i32>,
    pub verification_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DocumentCategory {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct DocumentVersion {
    pub id: Uuid,
    pub document_id: Uuid,
    pub version_number: i32,
    pub file_path: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub file_mime: Option<String>,
    pub change_notes: Option<String>,
    pub uploaded_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}
