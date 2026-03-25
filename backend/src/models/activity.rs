use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Activity {
    pub id: Uuid,
    pub program_id: Option<Uuid>,
    pub activity_type_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub location_id: Option<Uuid>,
    pub location_detail: Option<String>,
    pub activity_date: NaiveDate,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub pic_user_id: Option<Uuid>,
    pub target_participants: Option<i32>,
    pub actual_participants: Option<i32>,
    pub status: String,
    pub has_proposal: Option<bool>,
    pub has_attendance: Option<bool>,
    pub has_documentation: Option<bool>,
    pub has_report: Option<bool>,
    pub has_evaluation: Option<bool>,
    pub is_recurring: Option<bool>,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateActivityRequest {
    pub program_id: Option<Uuid>,
    pub activity_type_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub location_id: Option<Uuid>,
    pub location_detail: Option<String>,
    pub activity_date: NaiveDate,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub pic_user_id: Option<Uuid>,
    pub target_participants: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateActivityRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub actual_participants: Option<i32>,
    pub has_proposal: Option<bool>,
    pub has_attendance: Option<bool>,
    pub has_documentation: Option<bool>,
    pub has_report: Option<bool>,
    pub has_evaluation: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ActivityFilter {
    pub search: Option<String>,
    pub program_id: Option<Uuid>,
    pub status: Option<String>,
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
    pub location_id: Option<Uuid>,
}
