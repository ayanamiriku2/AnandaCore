use anyhow::{Context, Result};

fn require_env(name: &str) -> Result<String> {
    std::env::var(name).with_context(|| format!("Missing required environment variable: {}", name))
}

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub host: String,
    pub port: u16,
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub refresh_token_expiry_days: i64,
    pub s3_endpoint: String,
    pub s3_access_key: String,
    pub s3_secret_key: String,
    pub s3_bucket: String,
    pub s3_region: String,
    pub allowed_origins: Vec<String>,
    pub max_upload_size: usize,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let port = std::env::var("APP_PORT")
            .unwrap_or_else(|_| "8080".into())
            .parse()?;

        Ok(Self {
            database_url: require_env("DATABASE_URL")?,
            host: std::env::var("APP_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port,
            jwt_secret: require_env("JWT_SECRET")?,
            jwt_expiry_hours: std::env::var("JWT_EXPIRY_HOURS")
                .unwrap_or_else(|_| "24".into())
                .parse()?,
            refresh_token_expiry_days: std::env::var("REFRESH_TOKEN_EXPIRY_DAYS")
                .unwrap_or_else(|_| "30".into())
                .parse()?,
            s3_endpoint: std::env::var("S3_ENDPOINT").unwrap_or_else(|_| "http://localhost:9000".into()),
            s3_access_key: std::env::var("S3_ACCESS_KEY").unwrap_or_else(|_| "anandacore".into()),
            s3_secret_key: std::env::var("S3_SECRET_KEY").unwrap_or_else(|_| "anandacore_secret".into()),
            s3_bucket: std::env::var("S3_BUCKET").unwrap_or_else(|_| "anandacore-files".into()),
            s3_region: std::env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".into()),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".into())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            max_upload_size: std::env::var("MAX_UPLOAD_SIZE")
                .unwrap_or_else(|_| "32212254720".into()) // 30GB
                .parse()?,
        })
    }
}
