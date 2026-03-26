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
    // Validate date format (YYYY-MM-DD only) to prevent SQL injection
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
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()
            })
        }
        "surat_masuk" => {
            let w = build_where("letter_type = 'masuk' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM letters WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM letters WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()
            })
        }
        "surat_keluar" => {
            let w = build_where("letter_type = 'keluar' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM letters WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM letters WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()
            })
        }
        "kegiatan" => {
            let w = build_where("deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM activities WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM activities WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()
            })
        }
        "mitra" => {
            let w = build_where("deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM partners WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(status, 'tanpa_status') as status, COUNT(*) as count FROM partners WHERE {} GROUP BY status ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total": count,
                "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()
            })
        }
        "tugas_overdue" => {
            let w = build_where("due_date < NOW() AND status != 'selesai' AND deleted_at IS NULL", date_from, date_to);
            let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM tasks WHERE {}", w))
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_priority: Vec<(String, i64)> = sqlx::query_as(
                &format!("SELECT COALESCE(priority, 'normal') as priority, COUNT(*) as count FROM tasks WHERE {} GROUP BY priority ORDER BY count DESC", w)
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({
                "total_overdue": count,
                "by_status": by_priority.iter().map(|(s,c)| serde_json::json!({"status": format!("Prioritas: {}", s), "count": c})).collect::<Vec<_>>()
            })
        }
        _ => serde_json::json!({"message": "Tipe laporan tidak dikenal"}),
    };
    Ok(Json(serde_json::json!({"report_type": query.report_type, "data": data})))
}
