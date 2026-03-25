use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::{auth, errors::AppError, AppState};

pub mod auth_middleware;

pub use auth_middleware::*;
