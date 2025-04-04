//! API路由模块
//!
//! 包含所有API端点的路由定义
mod userapi;

use axum::{Router, middleware::from_fn, routing::post};

use sqlx::{Pool, Postgres};
use std::sync::Arc;

use crate::middleware::auth;

/// 创建API路由
pub fn create_routes() -> Router<Arc<Pool<Postgres>>> {
    // 公共路由 - 不需要认证
    let public_routes = Router::new()
        .route("/users/register", post(userapi::register_user))
        .route("/users/login", post(userapi::login_user))
        .route("/auth/refresh", post(auth::refresh_token_handler));

    // 用户路由 - 需要用户认证
    let user_routes = Router::new().layer(from_fn(auth::auth_middleware));

    // 管理员路由 - 需要管理员权限
    let admin_routes = Router::new()
        //.route("/posts", post(postapi::create_post))
        .layer(from_fn(auth::admin_middleware));

    // 合并所有路由
    Router::new()
        .merge(user_routes)
        .merge(admin_routes)
        .merge(public_routes)
}
