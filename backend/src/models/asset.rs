use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Asset {
    pub id: Uuid,
    pub name: String,
    pub asset_code: Option<String>,
    pub category_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub responsible_user_id: Option<Uuid>,
    pub acquisition_date: Option<NaiveDate>,
    pub acquisition_value: Option<rust_decimal::Decimal>,
    pub condition: Option<String>,
    pub status: Option<String>,
    pub description: Option<String>,
    pub photo_path: Option<String>,
    pub qr_code: Option<String>,
    pub notes: Option<String>,
    pub last_maintenance_date: Option<NaiveDate>,
    pub next_maintenance_date: Option<NaiveDate>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssetRequest {
    pub name: String,
    pub asset_code: Option<String>,
    pub category_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub responsible_user_id: Option<Uuid>,
    pub acquisition_date: Option<NaiveDate>,
    pub acquisition_value: Option<rust_decimal::Decimal>,
    pub condition: Option<String>,
    pub description: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAssetRequest {
    pub name: Option<String>,
    pub condition: Option<String>,
    pub status: Option<String>,
    pub responsible_user_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub notes: Option<String>,
    pub next_maintenance_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct AssetFilter {
    pub search: Option<String>,
    pub category_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub condition: Option<String>,
    pub status: Option<String>,
}
