use sqlx::PgPool;
use crate::errors::AppError;

pub async fn global_search(pool: &PgPool, query: &str, module: Option<&str>, limit: i64) -> Result<serde_json::Value, AppError> {
    let q = format!("%{}%", query);
    let mut results = Vec::new();

    let should_search = |m: &str| module.map_or(true, |mod_name| mod_name == m);

    if should_search("documents") {
        let docs: Vec<(uuid::Uuid, String, Option<String>)> = sqlx::query_as(
            "SELECT id, title, document_number FROM documents WHERE deleted_at IS NULL AND (title ILIKE $1 OR document_number ILIKE $1 OR description ILIKE $1) LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, title, num) in docs {
            results.push(serde_json::json!({"module": "documents", "id": id, "title": title, "subtitle": num}));
        }
    }

    if should_search("letters") {
        let letters: Vec<(uuid::Uuid, String, Option<String>, String)> = sqlx::query_as(
            "SELECT id, subject, letter_number, letter_type FROM letters WHERE deleted_at IS NULL AND (subject ILIKE $1 OR letter_number ILIKE $1 OR sender ILIKE $1 OR recipient ILIKE $1) LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, subject, num, lt) in letters {
            results.push(serde_json::json!({"module": "letters", "id": id, "title": subject, "subtitle": num, "type": lt}));
        }
    }

    if should_search("activities") {
        let acts: Vec<(uuid::Uuid, String)> = sqlx::query_as(
            "SELECT id, name FROM activities WHERE deleted_at IS NULL AND name ILIKE $1 LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, name) in acts {
            results.push(serde_json::json!({"module": "activities", "id": id, "title": name}));
        }
    }

    if should_search("partners") {
        let parts: Vec<(uuid::Uuid, String, Option<String>)> = sqlx::query_as(
            "SELECT id, name, city FROM partners WHERE deleted_at IS NULL AND (name ILIKE $1 OR city ILIKE $1) LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, name, city) in parts {
            results.push(serde_json::json!({"module": "partners", "id": id, "title": name, "subtitle": city}));
        }
    }

    if should_search("beneficiaries") {
        let bens: Vec<(uuid::Uuid, String, Option<String>)> = sqlx::query_as(
            "SELECT id, full_name, school_origin FROM beneficiaries WHERE deleted_at IS NULL AND (full_name ILIKE $1 OR school_origin ILIKE $1) LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, name, school) in bens {
            results.push(serde_json::json!({"module": "beneficiaries", "id": id, "title": name, "subtitle": school}));
        }
    }

    if should_search("tasks") {
        let tasks: Vec<(uuid::Uuid, String)> = sqlx::query_as(
            "SELECT id, title FROM tasks WHERE deleted_at IS NULL AND title ILIKE $1 LIMIT $2"
        ).bind(&q).bind(limit).fetch_all(pool).await.unwrap_or_default();
        for (id, title) in tasks {
            results.push(serde_json::json!({"module": "tasks", "id": id, "title": title}));
        }
    }

    Ok(serde_json::json!({"results": results, "query": query}))
}
