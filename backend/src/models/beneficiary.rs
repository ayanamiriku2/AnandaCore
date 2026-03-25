use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Beneficiary {
    pub id: Uuid,
    pub full_name: String,
    pub nik: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub birth_place: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub education_level: Option<String>,
    pub school_origin: Option<String>,
    pub status_id: Option<Uuid>,
    pub placement_status: Option<String>,
    pub placement_partner_id: Option<Uuid>,
    pub photo_path: Option<String>,
    pub internal_notes: Option<String>,
    pub registered_at: Option<NaiveDate>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBeneficiaryRequest {
    pub full_name: String,
    pub nik: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub birth_place: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub education_level: Option<String>,
    pub school_origin: Option<String>,
    pub status_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBeneficiaryRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub status_id: Option<Uuid>,
    pub placement_status: Option<String>,
    pub placement_partner_id: Option<Uuid>,
    pub internal_notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BeneficiaryFilter {
    pub search: Option<String>,
    pub status_id: Option<Uuid>,
    pub city: Option<String>,
    pub education_level: Option<String>,
    pub placement_status: Option<String>,
}
