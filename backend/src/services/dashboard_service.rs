use sqlx::PgPool;
use crate::errors::AppError;

pub async fn get_overview(pool: &PgPool) -> Result<serde_json::Value, AppError> {
    let total_programs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM programs WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let active_programs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM programs WHERE status = 'aktif' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_documents: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_letters: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let letters_in: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'masuk' AND deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())").fetch_one(pool).await.unwrap_or(0);
    let letters_out: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'keluar' AND deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())").fetch_one(pool).await.unwrap_or(0);
    let total_activities: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_partners: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_beneficiaries: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM beneficiaries WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let pending_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status != 'selesai' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let overdue_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'selesai' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let total_assets: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM assets WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);

    let expiring_mou: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partnership_agreements WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '90 days' AND status = 'aktif' AND deleted_at IS NULL"
    ).fetch_one(pool).await.unwrap_or(0);

    let expiring_docs: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM documents WHERE retention_until BETWEEN NOW() AND NOW() + INTERVAL '90 days' AND deleted_at IS NULL"
    ).fetch_one(pool).await.unwrap_or(0);

    // Recent activities (last 5)
    let recent_activities: Vec<(uuid::Uuid, String, Option<String>, Option<chrono::NaiveDate>, Option<String>)> = sqlx::query_as(
        "SELECT a.id, a.name, p.name as program_name, a.activity_date, a.status \
         FROM activities a LEFT JOIN programs p ON a.program_id = p.id \
         WHERE a.deleted_at IS NULL ORDER BY a.created_at DESC LIMIT 5"
    ).fetch_all(pool).await.unwrap_or_default();

    // Recent documents (last 5)
    let recent_documents: Vec<(uuid::Uuid, String, Option<String>, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        "SELECT id, title, document_number, created_at FROM documents \
         WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5"
    ).fetch_all(pool).await.unwrap_or_default();

    Ok(serde_json::json!({
        "total_programs": total_programs,
        "active_programs": active_programs,
        "total_documents": total_documents,
        "total_letters": total_letters,
        "surat_masuk_bulan_ini": letters_in,
        "surat_keluar_bulan_ini": letters_out,
        "total_activities": total_activities,
        "total_partners": total_partners,
        "total_beneficiaries": total_beneficiaries,
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "total_assets": total_assets,
        "tugas_terlambat": overdue_tasks,
        "mou_hampir_habis": expiring_mou,
        "dokumen_hampir_kedaluwarsa": expiring_docs,
        "recent_activities": recent_activities.iter().map(|(id, name, program_name, start_date, status)| {
            serde_json::json!({
                "id": id,
                "name": name,
                "program_name": program_name,
                "start_date": start_date,
                "status": status,
            })
        }).collect::<Vec<_>>(),
        "recent_documents": recent_documents.iter().map(|(id, title, doc_number, created_at)| {
            serde_json::json!({
                "id": id,
                "title": title,
                "document_number": doc_number,
                "created_at": created_at,
            })
        }).collect::<Vec<_>>(),
    }))
}

pub async fn get_charts(pool: &PgPool) -> Result<serde_json::Value, AppError> {
    // Documents per month (last 12 months)
    let doc_trend: Vec<(i32, i64)> = sqlx::query_as(
        "SELECT EXTRACT(MONTH FROM created_at)::int as month, COUNT(*) as count FROM documents WHERE created_at > NOW() - INTERVAL '12 months' AND deleted_at IS NULL GROUP BY month ORDER BY month"
    ).fetch_all(pool).await.unwrap_or_default();

    // Activities per month
    let activity_trend: Vec<(i32, i64)> = sqlx::query_as(
        "SELECT EXTRACT(MONTH FROM activity_date)::int as month, COUNT(*) as count FROM activities WHERE activity_date > NOW() - INTERVAL '12 months' AND deleted_at IS NULL GROUP BY month ORDER BY month"
    ).fetch_all(pool).await.unwrap_or_default();

    // Letters by status
    let letter_status: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*) FROM letters WHERE deleted_at IS NULL GROUP BY status"
    ).fetch_all(pool).await.unwrap_or_default();

    // Document categories distribution
    let doc_categories: Vec<(Option<uuid::Uuid>, i64)> = sqlx::query_as(
        "SELECT category_id, COUNT(*) FROM documents WHERE deleted_at IS NULL GROUP BY category_id ORDER BY count DESC LIMIT 10"
    ).fetch_all(pool).await.unwrap_or_default();

    Ok(serde_json::json!({
        "document_trend": doc_trend.iter().map(|(m,c)| serde_json::json!({"month": m, "count": c})).collect::<Vec<_>>(),
        "activity_trend": activity_trend.iter().map(|(m,c)| serde_json::json!({"month": m, "count": c})).collect::<Vec<_>>(),
        "letter_status": letter_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
        "doc_categories": doc_categories.iter().map(|(id,c)| serde_json::json!({"category_id": id, "count": c})).collect::<Vec<_>>(),
    }))
}
