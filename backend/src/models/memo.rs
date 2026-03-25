use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Memo {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub department_id: Option<Uuid>,
    pub priority: Option<String>,
    pub is_pinned: Option<bool>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemoRequest {
    pub title: String,
    pub content: String,
    pub department_id: Option<Uuid>,
    pub priority: Option<String>,
    pub is_pinned: Option<bool>,
    pub recipient_user_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemoRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub priority: Option<String>,
    pub is_pinned: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Announcement {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub priority: Option<String>,
    pub publish_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: Option<bool>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnouncementRequest {
    pub title: String,
    pub content: String,
    pub priority: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
}
