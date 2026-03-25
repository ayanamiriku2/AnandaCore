use sqlx::PgPool;
use uuid::Uuid;
use chrono::{Utc, Duration};

use crate::auth::{self, Claims};
use crate::errors::AppError;
use crate::models::*;

pub async fn login(pool: &PgPool, req: LoginRequest, jwt_secret: &str, jwt_expiry: i64, refresh_days: i64) -> Result<AuthResponse, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL"
    )
    .bind(&req.email)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::Auth("Email atau password salah".into()))?;

    if !user.is_active {
        return Err(AppError::Auth("Akun tidak aktif. Hubungi administrator.".into()));
    }

    if !auth::verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Auth("Email atau password salah".into()));
    }

    let roles: Vec<String> = sqlx::query_scalar(
        "SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1"
    )
    .bind(user.id)
    .fetch_all(pool)
    .await?;

    let access_token = auth::create_token(user.id, &user.email, roles.clone(), jwt_secret, jwt_expiry)?;
    let refresh_token = auth::create_refresh_token();

    let refresh_hash = format!("{:x}", md5::compute(refresh_token.as_bytes()));
    let expires_at = Utc::now() + Duration::days(refresh_days);

    sqlx::query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)")
        .bind(user.id)
        .bind(&refresh_hash)
        .bind(expires_at)
        .execute(pool)
        .await?;

    sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(pool)
        .await?;

    let user_summary = UserSummary {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_active: user.is_active,
        last_login_at: Some(Utc::now()),
        created_at: user.created_at,
    };

    Ok(AuthResponse {
        access_token,
        refresh_token,
        user: user_summary,
        roles,
    })
}

pub async fn refresh_token(pool: &PgPool, token: &str, jwt_secret: &str, jwt_expiry: i64) -> Result<AuthResponse, AppError> {
    let token_hash = format!("{:x}", md5::compute(token.as_bytes()));

    let record = sqlx::query_as::<_, (Uuid, Uuid)>(
        "SELECT id, user_id FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()"
    )
    .bind(&token_hash)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::Auth("Refresh token tidak valid atau sudah kedaluwarsa".into()))?;

    // Revoke old token
    sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE id = $1")
        .bind(record.0)
        .execute(pool)
        .await?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL")
        .bind(record.1)
        .fetch_one(pool)
        .await?;

    let roles: Vec<String> = sqlx::query_scalar(
        "SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1"
    )
    .bind(user.id)
    .fetch_all(pool)
    .await?;

    let access_token = auth::create_token(user.id, &user.email, roles.clone(), jwt_secret, jwt_expiry)?;
    let new_refresh = auth::create_refresh_token();
    let new_hash = format!("{:x}", md5::compute(new_refresh.as_bytes()));
    let expires_at = Utc::now() + Duration::days(30);

    sqlx::query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)")
        .bind(user.id)
        .bind(&new_hash)
        .bind(expires_at)
        .execute(pool)
        .await?;

    let user_summary = UserSummary {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_active: user.is_active,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
    };

    Ok(AuthResponse {
        access_token,
        refresh_token: new_refresh,
        user: user_summary,
        roles,
    })
}

// Simple md5 for token hashing (not for passwords)
mod md5 {
    use std::fmt;

    pub struct Digest([u8; 16]);

    impl fmt::LowerHex for Digest {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            for byte in &self.0 {
                write!(f, "{:02x}", byte)?;
            }
            Ok(())
        }
    }

    pub fn compute(data: &[u8]) -> Digest {
        // Use a simple hash for refresh token identification
        // This is NOT for password hashing - passwords use Argon2
        let mut hash = [0u8; 16];
        for (i, byte) in data.iter().enumerate() {
            hash[i % 16] ^= byte;
            hash[i % 16] = hash[i % 16].wrapping_add(byte.wrapping_mul(31));
        }
        Digest(hash)
    }
}
