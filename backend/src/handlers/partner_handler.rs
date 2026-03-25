use axum::{
    extract::{Multipart, Path, Query, State},
    Json,
};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::PaginationParams,
    errors::AppError,
    middleware::auth_middleware::CurrentUser,
    models::*,
    services::partner_service,
    storage::StorageService,
    AppState,
};

// ---------------------------------------------------------------------------
// Inline models for tables without dedicated model files
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PartnerInteraction {
    pub id: Uuid,
    pub partner_id: Uuid,
    pub interaction_type: Option<String>,
    pub subject: Option<String>,
    pub description: Option<String>,
    pub interaction_date: Option<NaiveDate>,
    pub follow_up_date: Option<NaiveDate>,
    pub follow_up_notes: Option<String>,
    pub conducted_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PartnerOpportunity {
    pub id: Uuid,
    pub partner_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub value: Option<rust_decimal::Decimal>,
    pub status: Option<String>,
    pub probability: Option<i32>,
    pub expected_close_date: Option<NaiveDate>,
    pub actual_close_date: Option<NaiveDate>,
    pub assigned_to: Option<Uuid>,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ---------------------------------------------------------------------------
// Create-request DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct CreateContactRequest {
    pub name: String,
    pub position: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAgreementRequest {
    pub title: String,
    pub agreement_number: Option<String>,
    pub cooperation_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub status: Option<String>,
    pub reminder_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInteractionRequest {
    pub interaction_type: Option<String>,
    pub subject: Option<String>,
    pub description: Option<String>,
    pub interaction_date: Option<NaiveDate>,
    pub follow_up_date: Option<NaiveDate>,
    pub follow_up_notes: Option<String>,
}

// ---------------------------------------------------------------------------
// 1. list – paginated partner list
// ---------------------------------------------------------------------------
pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
    Query(filter): Query<PartnerFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let resp = partner_service::list_partners(&state.db, &params, &filter).await?;
    Ok(Json(serde_json::to_value(resp).unwrap()))
}

// ---------------------------------------------------------------------------
// 2. get – single partner with contacts & agreements
// ---------------------------------------------------------------------------
pub async fn get(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let partner = partner_service::get_partner(&state.db, id).await?;
    let contacts = partner_service::get_contacts(&state.db, id).await?;
    let agreements = partner_service::get_agreements(&state.db, id).await?;
    Ok(Json(serde_json::json!({
        "partner": partner,
        "contacts": contacts,
        "agreements": agreements
    })))
}

// ---------------------------------------------------------------------------
// 3. create
// ---------------------------------------------------------------------------
pub async fn create(
    State(state): State<Arc<AppState>>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreatePartnerRequest>,
) -> Result<Json<Partner>, AppError> {
    Ok(Json(
        partner_service::create_partner(&state.db, req, current.id).await?,
    ))
}

// ---------------------------------------------------------------------------
// 4. update
// ---------------------------------------------------------------------------
pub async fn update(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePartnerRequest>,
) -> Result<Json<Partner>, AppError> {
    Ok(Json(
        partner_service::update_partner(&state.db, id, req).await?,
    ))
}

// ---------------------------------------------------------------------------
// 5. contacts – GET list
// ---------------------------------------------------------------------------
pub async fn contacts(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<PartnerContact>>, AppError> {
    Ok(Json(partner_service::get_contacts(&state.db, id).await?))
}

// ---------------------------------------------------------------------------
// 6. create_contact – POST new contact for a partner
// ---------------------------------------------------------------------------
pub async fn create_contact(
    State(state): State<Arc<AppState>>,
    Path(partner_id): Path<Uuid>,
    Json(req): Json<CreateContactRequest>,
) -> Result<Json<PartnerContact>, AppError> {
    // Verify partner exists
    partner_service::get_partner(&state.db, partner_id).await?;

    let contact = sqlx::query_as::<_, PartnerContact>(
        r#"INSERT INTO partner_contacts (partner_id, name, position, email, phone, is_primary, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *"#,
    )
    .bind(partner_id)
    .bind(&req.name)
    .bind(&req.position)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(req.is_primary.unwrap_or(false))
    .bind(&req.notes)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(contact))
}

// ---------------------------------------------------------------------------
// 7. agreements – GET list
// ---------------------------------------------------------------------------
pub async fn agreements(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<PartnershipAgreement>>, AppError> {
    Ok(Json(
        partner_service::get_agreements(&state.db, id).await?,
    ))
}

// ---------------------------------------------------------------------------
// 8. create_agreement – POST new agreement for a partner
// ---------------------------------------------------------------------------
pub async fn create_agreement(
    State(state): State<Arc<AppState>>,
    Path(partner_id): Path<Uuid>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateAgreementRequest>,
) -> Result<Json<PartnershipAgreement>, AppError> {
    // Verify partner exists
    partner_service::get_partner(&state.db, partner_id).await?;

    let agreement = sqlx::query_as::<_, PartnershipAgreement>(
        r#"INSERT INTO partnership_agreements
               (partner_id, title, agreement_number, cooperation_type_id,
                description, start_date, end_date, status, reminder_date, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *"#,
    )
    .bind(partner_id)
    .bind(&req.title)
    .bind(&req.agreement_number)
    .bind(req.cooperation_type_id)
    .bind(&req.description)
    .bind(req.start_date)
    .bind(req.end_date)
    .bind(&req.status)
    .bind(req.reminder_date)
    .bind(&req.notes)
    .bind(current.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(agreement))
}

// ---------------------------------------------------------------------------
// 9. upload_agreement_file – multipart upload for an agreement document
// ---------------------------------------------------------------------------
pub async fn upload_agreement_file(
    State(state): State<Arc<AppState>>,
    Path((partner_id, agreement_id)): Path<(Uuid, Uuid)>,
    mut multipart: Multipart,
) -> Result<Json<PartnershipAgreement>, AppError> {
    // Verify partner exists
    partner_service::get_partner(&state.db, partner_id).await?;

    // Verify agreement exists and belongs to this partner
    let _existing = sqlx::query_as::<_, PartnershipAgreement>(
        "SELECT * FROM partnership_agreements WHERE id = $1 AND partner_id = $2 AND deleted_at IS NULL",
    )
    .bind(agreement_id)
    .bind(partner_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Perjanjian tidak ditemukan".into()))?;

    let field = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Gagal membaca multipart: {}", e)))?
        .ok_or_else(|| AppError::BadRequest("Tidak ada file yang diunggah".into()))?;

    let file_name = field.file_name().unwrap_or("file").to_string();
    let content_type = field
        .content_type()
        .unwrap_or("application/octet-stream")
        .to_string();

    if !StorageService::validate_file_type(&content_type) {
        return Err(AppError::Validation(format!(
            "Tipe file '{}' tidak diizinkan",
            content_type
        )));
    }

    let data = field
        .bytes()
        .await
        .map_err(|e| AppError::BadRequest(format!("Gagal membaca file: {}", e)))?;

    if data.len() > state.config.max_upload_size {
        return Err(AppError::Validation(
            "Ukuran file melebihi batas maksimum".into(),
        ));
    }

    let key = StorageService::generate_key("agreements", &file_name);
    state
        .storage
        .upload(&key, data.to_vec(), &content_type)
        .await
        .map_err(|e| AppError::Internal(format!("Gagal upload: {}", e)))?;

    let updated = sqlx::query_as::<_, PartnershipAgreement>(
        r#"UPDATE partnership_agreements
           SET file_path = $1, file_name = $2, updated_at = NOW()
           WHERE id = $3 AND partner_id = $4
           RETURNING *"#,
    )
    .bind(&key)
    .bind(&file_name)
    .bind(agreement_id)
    .bind(partner_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(updated))
}

// ---------------------------------------------------------------------------
// 10. interactions – GET list for a partner
// ---------------------------------------------------------------------------
pub async fn interactions(
    State(state): State<Arc<AppState>>,
    Path(partner_id): Path<Uuid>,
) -> Result<Json<Vec<PartnerInteraction>>, AppError> {
    let rows = sqlx::query_as::<_, PartnerInteraction>(
        "SELECT * FROM partner_interactions WHERE partner_id = $1 ORDER BY interaction_date DESC NULLS LAST, created_at DESC",
    )
    .bind(partner_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows))
}

// ---------------------------------------------------------------------------
// 11. create_interaction – POST new interaction for a partner
// ---------------------------------------------------------------------------
pub async fn create_interaction(
    State(state): State<Arc<AppState>>,
    Path(partner_id): Path<Uuid>,
    axum::Extension(current): axum::Extension<CurrentUser>,
    Json(req): Json<CreateInteractionRequest>,
) -> Result<Json<PartnerInteraction>, AppError> {
    // Verify partner exists
    partner_service::get_partner(&state.db, partner_id).await?;

    let interaction = sqlx::query_as::<_, PartnerInteraction>(
        r#"INSERT INTO partner_interactions
               (partner_id, interaction_type, subject, description,
                interaction_date, follow_up_date, follow_up_notes, conducted_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *"#,
    )
    .bind(partner_id)
    .bind(&req.interaction_type)
    .bind(&req.subject)
    .bind(&req.description)
    .bind(req.interaction_date)
    .bind(req.follow_up_date)
    .bind(&req.follow_up_notes)
    .bind(current.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(interaction))
}

// ---------------------------------------------------------------------------
// 12. soft_delete – set deleted_at = NOW()
// ---------------------------------------------------------------------------
pub async fn soft_delete(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query(
        "UPDATE partners SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Mitra tidak ditemukan".into()));
    }

    Ok(Json(serde_json::json!({"message": "Mitra berhasil dihapus"})))
}

// ---------------------------------------------------------------------------
// 13. restore – set deleted_at = NULL
// ---------------------------------------------------------------------------
pub async fn restore(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Partner>, AppError> {
    let partner = sqlx::query_as::<_, Partner>(
        "UPDATE partners SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Mitra tidak ditemukan atau belum dihapus".into()))?;

    Ok(Json(partner))
}
