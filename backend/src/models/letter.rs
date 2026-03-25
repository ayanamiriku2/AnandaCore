use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Letter {
    pub id: Uuid,
    pub letter_type: String,
    pub agenda_number: Option<String>,
    pub letter_number: Option<String>,
    pub letter_date: Option<NaiveDate>,
    pub received_date: Option<NaiveDate>,
    pub sent_date: Option<NaiveDate>,
    pub sender: Option<String>,
    pub recipient: Option<String>,
    pub subject: String,
    pub classification_id: Option<Uuid>,
    pub attachment_count: Option<i32>,
    pub attachment_notes: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub status: String,
    pub follow_up_status: Option<String>,
    pub follow_up_deadline: Option<NaiveDate>,
    pub follow_up_notes: Option<String>,
    pub responsible_user_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLetterRequest {
    pub letter_type: String,
    pub agenda_number: Option<String>,
    pub letter_number: Option<String>,
    pub letter_date: Option<NaiveDate>,
    pub received_date: Option<NaiveDate>,
    pub sent_date: Option<NaiveDate>,
    pub sender: Option<String>,
    pub recipient: Option<String>,
    pub subject: String,
    pub classification_id: Option<Uuid>,
    pub attachment_count: Option<i32>,
    pub attachment_notes: Option<String>,
    pub responsible_user_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLetterRequest {
    pub letter_number: Option<String>,
    pub subject: Option<String>,
    pub status: Option<String>,
    pub follow_up_status: Option<String>,
    pub follow_up_deadline: Option<NaiveDate>,
    pub follow_up_notes: Option<String>,
    pub responsible_user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct LetterFilter {
    pub search: Option<String>,
    pub letter_type: Option<String>,
    pub status: Option<String>,
    pub follow_up_status: Option<String>,
    pub classification_id: Option<Uuid>,
    pub year: Option<i32>,
    pub month: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct LetterDisposition {
    pub id: Uuid,
    pub letter_id: Uuid,
    pub from_user_id: Option<Uuid>,
    pub to_user_id: Uuid,
    pub instruction: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub read_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDispositionRequest {
    pub to_user_id: Uuid,
    pub instruction: Option<String>,
    pub priority: Option<String>,
}
