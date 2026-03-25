use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Partner {
    pub id: Uuid,
    pub name: String,
    pub partner_type: Option<String>,
    pub industry: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub website: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub description: Option<String>,
    pub pipeline_status: String,
    pub relationship_status: Option<String>,
    pub internal_notes: Option<String>,
    pub logo_path: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePartnerRequest {
    pub name: String,
    pub partner_type: Option<String>,
    pub industry: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub website: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePartnerRequest {
    pub name: Option<String>,
    pub partner_type: Option<String>,
    pub pipeline_status: Option<String>,
    pub relationship_status: Option<String>,
    pub internal_notes: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PartnerFilter {
    pub search: Option<String>,
    pub partner_type: Option<String>,
    pub pipeline_status: Option<String>,
    pub city: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PartnerContact {
    pub id: Uuid,
    pub partner_id: Uuid,
    pub name: String,
    pub position: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PartnershipAgreement {
    pub id: Uuid,
    pub partner_id: Uuid,
    pub agreement_number: Option<String>,
    pub title: String,
    pub cooperation_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub status: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub reminder_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}
