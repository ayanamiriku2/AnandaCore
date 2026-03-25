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

pub async fn generate(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let data = match query.report_type.as_str() {
        "dokumen" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            let by_status: Vec<(String, i64)> = sqlx::query_as(
                "SELECT status, COUNT(*) as count FROM documents WHERE deleted_at IS NULL GROUP BY status ORDER BY count DESC"
            ).fetch_all(&state.db).await.unwrap_or_default();
            serde_json::json!({"total": count, "by_status": by_status.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>()})
        }
        "surat_masuk" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'masuk' AND deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            serde_json::json!({"total": count})
        }
        "surat_keluar" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM letters WHERE letter_type = 'keluar' AND deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            serde_json::json!({"total": count})
        }
        "kegiatan" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities WHERE deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            serde_json::json!({"total": count})
        }
        "mitra" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            serde_json::json!({"total": count})
        }
        "tugas_overdue" => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'selesai' AND deleted_at IS NULL")
                .fetch_one(&state.db).await.unwrap_or(0);
            serde_json::json!({"total_overdue": count})
        }
        _ => serde_json::json!({"message": "Tipe laporan tidak dikenal"}),
    };
    Ok(Json(serde_json::json!({"report_type": query.report_type, "data": data})))
}
