use sqlx::PgPool;
use uuid::Uuid;

use crate::db::*;
use crate::errors::AppError;
use crate::models::*;

pub async fn create_letter(pool: &PgPool, req: CreateLetterRequest, user_id: Uuid) -> Result<Letter, AppError> {
    if req.letter_type != "masuk" && req.letter_type != "keluar" {
        return Err(AppError::Validation("Tipe surat harus 'masuk' atau 'keluar'".into()));
    }

    let letter = sqlx::query_as::<_, Letter>(
        r#"INSERT INTO letters (letter_type, agenda_number, letter_number, letter_date, received_date,
            sent_date, sender, recipient, subject, classification_id, attachment_count,
            attachment_notes, responsible_user_id, department_id, created_by, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
        RETURNING *"#
    )
    .bind(&req.letter_type)
    .bind(&req.agenda_number)
    .bind(&req.letter_number)
    .bind(req.letter_date)
    .bind(req.received_date)
    .bind(req.sent_date)
    .bind(&req.sender)
    .bind(&req.recipient)
    .bind(&req.subject)
    .bind(req.classification_id)
    .bind(req.attachment_count.unwrap_or(0))
    .bind(&req.attachment_notes)
    .bind(req.responsible_user_id)
    .bind(req.department_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(letter)
}

pub async fn list_letters(pool: &PgPool, pagination: &PaginationParams, filter: &LetterFilter) -> Result<PaginatedResponse<Letter>, AppError> {
    let mut conditions = vec!["deleted_at IS NULL".to_string()];

    if let Some(ref lt) = filter.letter_type {
        conditions.push(format!("letter_type = '{}'", lt));
    }
    if let Some(ref st) = filter.status {
        conditions.push(format!("status = '{}'", st));
    }
    if let Some(ref fu) = filter.follow_up_status {
        conditions.push(format!("follow_up_status = '{}'", fu));
    }

    let where_clause = conditions.join(" AND ");

    let total: i64 = sqlx::query_scalar(
        &format!("SELECT COUNT(*) FROM letters WHERE {}", where_clause)
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let data = sqlx::query_as::<_, Letter>(
        &format!(
            "SELECT * FROM letters WHERE {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            where_clause, pagination.per_page(), pagination.offset()
        )
    )
    .fetch_all(pool)
    .await?;

    Ok(PaginatedResponse::new(data, total, pagination))
}

pub async fn get_letter(pool: &PgPool, id: Uuid) -> Result<Letter, AppError> {
    sqlx::query_as::<_, Letter>("SELECT * FROM letters WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Surat tidak ditemukan".into()))
}

pub async fn update_letter(pool: &PgPool, id: Uuid, req: UpdateLetterRequest) -> Result<Letter, AppError> {
    sqlx::query_as::<_, Letter>(
        r#"UPDATE letters SET
            letter_number = COALESCE($2, letter_number),
            subject = COALESCE($3, subject),
            status = COALESCE($4, status),
            follow_up_status = COALESCE($5, follow_up_status),
            follow_up_deadline = COALESCE($6, follow_up_deadline),
            follow_up_notes = COALESCE($7, follow_up_notes)
        WHERE id = $1 RETURNING *"#
    )
    .bind(id)
    .bind(&req.letter_number)
    .bind(&req.subject)
    .bind(&req.status)
    .bind(&req.follow_up_status)
    .bind(req.follow_up_deadline)
    .bind(&req.follow_up_notes)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)
}

pub async fn create_disposition(pool: &PgPool, letter_id: Uuid, req: CreateDispositionRequest, from_user: Uuid) -> Result<LetterDisposition, AppError> {
    let disp = sqlx::query_as::<_, LetterDisposition>(
        "INSERT INTO letter_dispositions (letter_id, from_user_id, to_user_id, instruction, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(letter_id)
    .bind(from_user)
    .bind(req.to_user_id)
    .bind(&req.instruction)
    .bind(req.priority.unwrap_or_else(|| "normal".into()))
    .fetch_one(pool)
    .await?;
    Ok(disp)
}

pub async fn get_dispositions(pool: &PgPool, letter_id: Uuid) -> Result<Vec<LetterDisposition>, AppError> {
    let disps = sqlx::query_as::<_, LetterDisposition>(
        "SELECT * FROM letter_dispositions WHERE letter_id = $1 ORDER BY created_at DESC"
    )
    .bind(letter_id)
    .fetch_all(pool)
    .await?;
    Ok(disps)
}
