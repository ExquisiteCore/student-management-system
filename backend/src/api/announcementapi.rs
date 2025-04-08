//! 系统公告API
//!
//! 提供系统公告相关的API接口

use axum::{Json, extract::State, http::StatusCode};
use sqlx::{Pool, Postgres};
use std::sync::Arc;

use crate::model::models::announcement::{Announcement, CreateAnnouncementRequest};

/// 创建新的公告
pub async fn create_announcement(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateAnnouncementRequest>,
) -> Result<Json<Announcement>, (StatusCode, String)> {
    let announcement = Announcement::create(&pool, req).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("创建公告失败: {}", e),
        )
    })?;

    Ok(Json(announcement))
}

/// 获取所有有效公告
pub async fn get_all_announcements(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<Announcement>>, (StatusCode, String)> {
    let announcements = Announcement::find_all(&pool, 20).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("获取公告失败: {}", e),
        )
    })?;

    Ok(Json(announcements))
}
