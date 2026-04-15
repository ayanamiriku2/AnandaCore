use anyhow::Result;
use axum::{
    http::{header, Method},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod storage;
mod upload_stream;

pub use config::AppConfig;

pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: AppConfig,
    pub storage: storage::StorageService,
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info,anandacore=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = match AppConfig::from_env() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to load configuration: {}", e);
            tracing::error!("Make sure DATABASE_URL and JWT_SECRET are set");
            return Err(e);
        }
    };

    tracing::info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await
        .map_err(|e| {
            tracing::error!("Failed to connect to database: {}", e);
            e
        })?;

    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("Migrations complete");

    tracing::info!("Connecting to S3/MinIO at {}...", config.s3_endpoint);
    let storage = storage::StorageService::new(&config).await
        .map_err(|e| {
            tracing::error!("Failed to connect to S3/MinIO: {}", e);
            tracing::error!("Check S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY");
            e
        })?;

    let state = Arc::new(AppState {
        db: pool,
        config: config.clone(),
        storage,
    });

    let cors = CorsLayer::new()
        .allow_origin(config.allowed_origins.iter().map(|o| o.parse().unwrap()).collect::<Vec<_>>())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        .allow_credentials(true);

    let app = Router::new()
        .route("/", axum::routing::get(|| async {
            axum::Json(serde_json::json!({
                "service": "AnandaCore API",
                "status": "running",
                "version": env!("CARGO_PKG_VERSION"),
                "docs": "/api/health"
            }))
        }))
        .nest("/api", routes::api_routes(state.clone()))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("AnandaCore API starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
