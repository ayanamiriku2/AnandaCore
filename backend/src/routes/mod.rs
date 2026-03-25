use axum::{
    middleware,
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;

use crate::{handlers::*, middleware::auth_middleware::require_auth, AppState};

pub fn api_routes(state: Arc<AppState>) -> Router {
    let public = Router::new()
        .route("/auth/login", post(auth_handler::login))
        .route("/auth/refresh", post(auth_handler::refresh))
        .route("/health", get(|| async { axum::Json(serde_json::json!({"status": "ok", "service": "AnandaCore API"})) }))
        .route("/files/*key", get(file_handler::download))
        .route("/media/albums/:id/public", get(media_handler::get_album_public));

    let protected = Router::new()
        // Auth
        .route("/auth/me", get(auth_handler::me))

        // Dashboard
        .route("/dashboard/overview", get(dashboard_handler::overview))
        .route("/dashboard/charts", get(dashboard_handler::charts))

        // Users
        .route("/users", get(user_handler::list).post(user_handler::create))
        .route("/users/:id", get(user_handler::get).put(user_handler::update).delete(user_handler::delete))
        .route("/users/:id/roles", put(user_handler::assign_roles))

        // Documents
        .route("/documents", get(document_handler::list).post(document_handler::create))
        .route("/documents/:id", get(document_handler::get).put(document_handler::update).delete(document_handler::soft_delete))
        .route("/documents/:id/upload", post(document_handler::upload_file))
        .route("/documents/:id/download", get(document_handler::download_file))
        .route("/documents/:id/verify", post(document_handler::verify))
        .route("/documents/:id/versions", get(document_handler::versions))
        .route("/documents/:id/restore", post(document_handler::restore))
        .route("/documents/categories", get(document_handler::categories))

        // Letters
        .route("/letters", get(letter_handler::list).post(letter_handler::create))
        .route("/letters/:id", get(letter_handler::get).put(letter_handler::update).delete(letter_handler::soft_delete))
        .route("/letters/:id/dispositions", get(letter_handler::get_dispositions).post(letter_handler::create_disposition))
        .route("/letters/:id/attachments", get(letter_handler::get_attachments).post(letter_handler::upload_attachment))
        .route("/letters/:id/restore", post(letter_handler::restore))
        .route("/letters/attachments/:attachment_id/download", get(letter_handler::download_attachment))

        // Programs
        .route("/programs", get(program_handler::list).post(program_handler::create))
        .route("/programs/:id", get(program_handler::get).put(program_handler::update).delete(program_handler::delete))

        // Activities
        .route("/activities", get(activity_handler::list).post(activity_handler::create))
        .route("/activities/:id", get(activity_handler::get).put(activity_handler::update).delete(activity_handler::delete))

        // Partners
        .route("/partners", get(partner_handler::list).post(partner_handler::create))
        .route("/partners/:id", get(partner_handler::get).put(partner_handler::update).delete(partner_handler::soft_delete))
        .route("/partners/:id/contacts", get(partner_handler::contacts).post(partner_handler::create_contact))
        .route("/partners/:id/agreements", get(partner_handler::agreements).post(partner_handler::create_agreement))
        .route("/partners/:id/agreements/:agreement_id/upload", post(partner_handler::upload_agreement_file))
        .route("/partners/:id/interactions", get(partner_handler::interactions).post(partner_handler::create_interaction))
        .route("/partners/:id/opportunities", get(partner_handler::opportunities).post(partner_handler::create_opportunity))
        .route("/partners/:id/opportunities/:opp_id", put(partner_handler::update_opportunity))
        .route("/partners/:id/restore", post(partner_handler::restore))

        // Beneficiaries
        .route("/beneficiaries", get(beneficiary_handler::list).post(beneficiary_handler::create))
        .route("/beneficiaries/:id", get(beneficiary_handler::get).put(beneficiary_handler::update).delete(beneficiary_handler::delete))

        // Tasks
        .route("/tasks", get(task_handler::list).post(task_handler::create))
        .route("/tasks/:id", get(task_handler::get).put(task_handler::update).delete(task_handler::delete))
        .route("/tasks/:id/comments", post(task_handler::add_comment))

        // Assets
        .route("/assets", get(asset_handler::list).post(asset_handler::create))
        .route("/assets/:id", get(asset_handler::get).put(asset_handler::update).delete(asset_handler::delete))

        // Media
        .route("/media/albums", get(media_handler::list_albums).post(media_handler::create_album))
        .route("/media/albums/:id", get(media_handler::get_album).put(media_handler::update_album).delete(media_handler::soft_delete_album))
        .route("/media/albums/:id/upload", post(media_handler::upload_asset))
        .route("/media/albums/:id/restore", post(media_handler::restore_album))
        .route("/media/assets", get(media_handler::list_assets))
        .route("/media/assets/:id", delete(media_handler::delete_asset))

        // Memos & Announcements
        .route("/memos", get(memo_handler::list_memos).post(memo_handler::create_memo))
        .route("/memos/:id", put(memo_handler::update_memo).delete(memo_handler::delete_memo))
        .route("/announcements", get(memo_handler::list_announcements).post(memo_handler::create_announcement))

        // Notifications
        .route("/notifications", get(notification_handler::list))
        .route("/notifications/unread-count", get(notification_handler::unread_count))
        .route("/notifications/mark-all-read", post(notification_handler::mark_all_read))
        .route("/notifications/:id/read", post(notification_handler::mark_read))

        // Audit & Backup
        .route("/audit-logs", get(audit_handler::list))
        .route("/backup-logs", get(audit_handler::backup_logs))

        // Search
        .route("/search", get(search_handler::global_search))

        // Reports
        .route("/reports", get(report_handler::generate))

        // Files
        .route("/files/upload", post(file_handler::upload))

        // Master Data
        .route("/master/departments", get(master_data_handler::list_departments).post(master_data_handler::create_department))
        .route("/master/departments/:id", put(master_data_handler::update_department))
        .route("/master/roles", get(master_data_handler::list_roles).post(master_data_handler::create_role))
        .route("/master/permissions", get(master_data_handler::list_permissions))
        .route("/master/tags", get(master_data_handler::list_tags))
        .route("/master/letter-classifications", get(master_data_handler::list_letter_classifications))
        .route("/master/activity-types", get(master_data_handler::list_activity_types))
        .route("/master/asset-categories", get(master_data_handler::list_asset_categories))
        .route("/master/locations", get(master_data_handler::list_locations))
        .route("/master/participant-statuses", get(master_data_handler::list_participant_statuses))

        // Settings
        .route("/settings", get(settings_handler::list))
        .route("/settings/:key", put(settings_handler::update))

        .layer(middleware::from_fn_with_state(state.clone(), require_auth));

    Router::new()
        .merge(public)
        .merge(protected)
        .with_state(state)
}
