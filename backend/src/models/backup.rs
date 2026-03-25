use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BackupLog {
    pub id: Uuid,
    pub backup_type: String,
    pub source: Option<String>,
    pub destination: Option<String>,
    pub file_count: Option<i32>,
    pub total_size: Option<i64>,
    pub status: String,
    pub error_message: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub initiated_by: Option<Uuid>,
}
