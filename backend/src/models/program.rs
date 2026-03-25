use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Program {
    pub id: Uuid,
    pub name: String,
    pub program_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub objectives: Option<String>,
    pub target_audience: Option<String>,
    pub department_id: Option<Uuid>,
    pub pic_user_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub status: String,
    pub budget_notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProgramRequest {
    pub name: String,
    pub program_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub objectives: Option<String>,
    pub target_audience: Option<String>,
    pub department_id: Option<Uuid>,
    pub pic_user_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProgramRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub objectives: Option<String>,
    pub status: Option<String>,
    pub pic_user_id: Option<Uuid>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct ProgramFilter {
    pub search: Option<String>,
    pub status: Option<String>,
    pub department_id: Option<Uuid>,
    pub program_type_id: Option<Uuid>,
}
