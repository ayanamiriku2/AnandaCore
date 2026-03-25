use sqlx::PgPool;
use crate::errors::AppError;

pub async fn get_overview(pool: &PgPool) -> Result<serde_json::Value, AppError> {
    let programs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM programs WHERE status = 'aktif' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let documents: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let letters_in: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'masuk' AND deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())").fetch_one(pool).await.unwrap_or(0);
    let letters_out: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'keluar' AND deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())").fetch_one(pool).await.unwrap_or(0);
    let activities: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities WHERE status IN ('berjalan','disetujui') AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let partners: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM partners WHERE pipeline_status = 'aktif' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let beneficiaries: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM beneficiaries WHERE deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let pending_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status != 'selesai' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);
    let overdue_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'selesai' AND deleted_at IS NULL").fetch_one(pool).await.unwrap_or(0);

    let expiring_mou: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partnership_agreements WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '90 days' AND status = 'aktif' AND deleted_at IS NULL"
    ).fetch_one(pool).await.unwrap_or(0);

    let expiring_docs: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM documents WHERE retention_until BETWEEN NOW() AND NOW() + INTERVAL '90 days' AND deleted_at IS NULL"
    ).fetch_one(pool).await.unwrap_or(0);

    Ok(serde_json::json!({
        "program_aktif": programs,
        "total_dokumen": documents,
        "surat_masuk_bulan_ini": letters_in,
        "surat_keluar_bulan_ini": letters_out,
        "kegiatan_berjalan": activities,
        "mitra_aktif": partners,
        "total_peserta": beneficiaries,
        "tugas_belum_selesai": pending_tasks,
        "tugas_terlambat": overdue_tasks,
        "mou_hampir_habis": expiring_mou,
        "dokumen_hampir_kedaluwarsa": expiring_docs,
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
