//! 活动记录API
//!
//! 提供活动记录相关的API接口

use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
};
use serde::Deserialize;
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use uuid::Uuid;

use crate::model::models::activity::{Activity, CreateActivityRequest};

/// 获取活动记录的查询参数
#[derive(Debug, Deserialize)]
pub struct ActivityQuery {
    /// 限制返回的记录数量，默认为20
    #[serde(default = "default_limit")]
    pub limit: i64,
    /// 活动类型，可选
    pub activity_type: Option<String>,
    /// 用户ID，可选
    pub user_id: Option<Uuid>,
}

/// 默认的记录数量限制
fn default_limit() -> i64 {
    20
}

/// 获取最近的活动记录
///
/// 根据查询参数获取活动记录，可以按照活动类型或用户ID进行筛选
pub async fn get_activities(
    State(pool): State<Arc<Pool<Postgres>>>,
    Query(query): Query<ActivityQuery>,
) -> Result<Json<Vec<Activity>>, (StatusCode, String)> {
    let activities = if let Some(user_id) = query.user_id {
        // 按用户ID筛选
        Activity::find_by_user_id(&pool, user_id, query.limit)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("获取用户活动记录失败: {}", e),
                )
            })?
    } else if let Some(activity_type) = &query.activity_type {
        // 按活动类型筛选
        Activity::find_by_activity_type(&pool, activity_type, query.limit)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("获取活动类型记录失败: {}", e),
                )
            })?
    } else {
        // 获取所有活动记录
        Activity::find_all(&pool, query.limit).await.map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("获取活动记录失败: {}", e),
            )
        })?
    };

    Ok(Json(activities))
}

/// 创建新的活动记录
pub async fn create_activity(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateActivityRequest>,
) -> Result<Json<Activity>, (StatusCode, String)> {
    let activity = Activity::create(&pool, req).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("创建活动记录失败: {}", e),
        )
    })?;

    Ok(Json(activity))
}
