use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::{auth, errors::AppError, AppState};

#[derive(Clone, Debug)]
pub struct CurrentUser {
    pub id: uuid::Uuid,
    pub email: String,
    pub roles: Vec<String>,
}

pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::Auth("Token autentikasi diperlukan".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Auth("Format token tidak valid".into()))?;

    let claims = auth::verify_token(token, &state.config.jwt_secret)?;

    let user = CurrentUser {
        id: claims.sub,
        email: claims.email,
        roles: claims.roles,
    };

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}

pub fn require_role(required_roles: &[&str]) -> Vec<String> {
    required_roles.iter().map(|r| r.to_string()).collect()
}

pub fn has_permission(user: &CurrentUser, required: &[String]) -> bool {
    if user.roles.iter().any(|r| r == "super_admin") {
        return true;
    }
    required.iter().any(|r| user.roles.contains(r))
}
