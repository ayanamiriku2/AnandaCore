use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MediaAlbum {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub activity_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub album_date: Option<NaiveDate>,
    pub cover_image_path: Option<String>,
    pub is_featured: Option<bool>,
    pub status: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    #[sqlx(default)]
    pub asset_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MediaAsset {
    pub id: Uuid,
    pub album_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub media_type: String,
    pub file_path: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub file_mime: Option<String>,
    pub thumbnail_path: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub is_featured: Option<bool>,
    pub upload_status: Option<String>,
    pub checksum: Option<String>,
    pub uploaded_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAlbumRequest {
    pub title: String,
    pub description: Option<String>,
    pub activity_id: Option<Uuid>,
    pub program_id: Option<Uuid>,
    pub album_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAlbumRequest {
    pub title: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MediaFilter {
    pub search: Option<String>,
    pub media_type: Option<String>,
    pub album_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
}
