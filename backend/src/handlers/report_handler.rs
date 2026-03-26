use axum::{extract::{Query, State}, Json};
use std::sync::Arc;
use crate::{errors::AppError, AppState};

#[derive(Debug, serde::Deserialize)]
pub struct ReportQuery {
    pub report_type: String,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub department_id: Option<String>,
    pub program_id: Option<String>,
}

fn validate_date(d: &str) -> bool {
    d.len() == 10
        && d.chars().enumerate().all(|(i, c)| {
            if i == 4 || i == 7 { c == '-' } else { c.is_ascii_digit() }
        })
}

fn build_where(base: &str, date_from: Option<&str>, date_to: Option<&str>) -> String {
    let mut w = base.to_string();
    if let Some(df) = date_from {
        w.push_str(&format!(" AND created_at >= '{}'", df));
    }
    if let Some(dt) = date_to {
        w.push_str(&format!(" AND created_at <= '{}T23:59:59'", dt));
    }
    w
}

pub async fn generate(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let date_from = query.date_from.as_deref().filter(|d| validate_date(d));
    let date_to = query.date_to.as_deref().filter(|d| validate_date(d));

    let data = match query.report_type.as_str() {
        "dokumen" => {
            let w = build_where("deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM documents WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT status, COUNT(*) as count FROM documents WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, Option<String>, String, String)> = sqlx::query_as(
                &format!("SELECT title, document_number, status, TO_CHAR(created_at, 'YYYY-MM-DD') as tanggal FROM documents WHERE {} ORDER BY created_at DESC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(title, num, status, date)| serde_json::json!({
                    "cols": [title, num.as_deref().unwrap_or("-"), status, date]
                })).collect::<Vec<_>>(),
                "columns": ["Judul", "Nomor", "Status", "Tanggal"]
            })
        }
        "surat_masuk" => {
            let w = build_where("letter_type = 'masuk' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM letters WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM letters WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, Option<String>, Option<String>, String, String)> = sqlx::query_as(
                &format!("SELECT subject, letter_number, sender, status, TO_CHAR(created_at, 'YYYY-MM-DD') as tanggal FROM letters WHERE {} ORDER BY created_at DESC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(subj, num, sender, status, date)| serde_json::json!({
                    "cols": [subj, num.as_deref().unwrap_or("-"), sender.as_deref().unwrap_or("-"), status, date]
                })).collect::<Vec<_>>(),
                "columns": ["Perihal", "Nomor Surat", "Pengirim", "Status", "Tanggal"]
            })
        }
        "surat_keluar" => {
            let w = build_where("letter_type = 'keluar' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM letters WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM letters WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, Option<String>, Option<String>, String, String)> = sqlx::query_as(
                &format!("SELECT subject, letter_number, recipient, status, TO_CHAR(created_at, 'YYYY-MM-DD') as tanggal FROM letters WHERE {} ORDER BY created_at DESC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(subj, num, recipient, status, date)| serde_json::json!({
                    "cols": [subj, num.as_deref().unwrap_or("-"), recipient.as_deref().unwrap_or("-"), status, date]
                })).collect::<Vec<_>>(),
                "columns": ["Perihal", "Nomor Surat", "Penerima", "Status", "Tanggal"]
            })
        }
        "kegiatan" => {
            let w = build_where("deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM activities WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM activities WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, String, Option<i32>, String)> = sqlx::query_as(
                &format!("SELECT name, status, actual_participants, TO_CHAR(activity_date, 'YYYY-MM-DD') as tanggal FROM activities WHERE {} ORDER BY activity_date DESC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(name, status, participants, date)| serde_json::json!({
                    "cols": [name, status, &participants.map(|p| p.to_string()).unwrap_or("-".to_string()), date]
                })).collect::<Vec<_>>(),
                "columns": ["Nama Kegiatan", "Status", "Peserta", "Tanggal"]
            })
        }
        "mitra" => {
            let w = build_where("deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM partners WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(pipeline_status, 'tanpa_status') as status, COUNT(*) as count FROM partners WHERE {} GROUP BY pipeline_status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, Option<String>, String, Option<String>)> = sqlx::query_as(
                &format!("SELECT name, partner_type, pipeline_status, city FROM partners WHERE {} ORDER BY created_at DESC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(name, ptype, status, city)| serde_json::json!({
                    "cols": [name, ptype.as_deref().unwrap_or("-"), status, city.as_deref().unwrap_or("-")]
                })).collect::<Vec<_>>(),
                "columns": ["Nama Mitra", "Tipe", "Status Pipeline", "Kota"]
            })
        }
        "tugas_overdue" => {
            let w = build_where("due_date < NOW() AND status != 'selesai' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM tasks WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_priority: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(priority, 'normal') as priority, COUNT(*) as count FROM tasks WHERE {} GROUP BY priority ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            let items: Vec<(String, String, Option<String>, String)> = sqlx::query_as(
                &format!("SELECT title, status, priority, TO_CHAR(due_date, 'YYYY-MM-DD') as batas FROM tasks WHERE {} ORDER BY due_date ASC LIMIT 50", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total_overdue": count,
                "by_status": by_priority.iter().map(|(s,c)| serde_json::json!({"status": format!("Prioritas: {}", s), "count": c})).collect::<Vec<_>>(),
                "items": items.iter().map(|(title, status, priority, due)| serde_json::json!({
                    "cols": [title, status, priority.as_deref().unwrap_or("normal"), due]
                })).collect::<Vec<_>>(),
                "columns": ["Judul Tugas", "Status", "Prioritas", "Batas Waktu"]
            })
        }
        _ => serde_json::json!({"message": "Tipe laporan tidak dikenal"}),
    };
    Ok(Json(serde_json::json!({"report_type": query.report_type, "data": data})))
}
