use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub message: Option<String>,
    pub notification_type: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub is_read: Option<bool>,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
