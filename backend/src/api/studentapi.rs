//! 学生API模块
//!
//! 提供学生相关的API端点

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use uuid::Uuid;

use crate::model::models::user::{CreateUserRequest, UpdateUserRequest, User, UserWithDetails};

/// 创建学生
pub async fn create_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(mut req): Json<CreateUserRequest>,
) -> Result<Json<User>, (StatusCode, String)> {
    // 确保角色为学生
    req.role = Some("student".to_string());

    match User::create(&pool, req).await {
        Ok(user) => Ok(Json(user)),
        Err(e) => {
            eprintln!("创建学生失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建学生失败".to_string(),
            ))
        }
    }
}

/// 获取学生信息
pub async fn get_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserWithDetails>, (StatusCode, String)> {
    match User::find_with_details(&pool, id).await {
        Ok(Some(user_details)) => {
            // 验证用户是否为学生
            if user_details.user.role.to_lowercase() != "student" {
                return Err((StatusCode::NOT_FOUND, "学生不存在".to_string()));
            }
            Ok(Json(user_details))
        }
        Ok(None) => Err((StatusCode::NOT_FOUND, "学生不存在".to_string())),
        Err(e) => {
            eprintln!("获取学生失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取学生失败".to_string(),
            ))
        }
    }
}

/// 更新学生信息
pub async fn update_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<User>, (StatusCode, String)> {
    // 首先验证用户是否存在且为学生
    match User::find_by_id(&pool, id).await {
        Ok(Some(user)) => {
            if user.role.to_lowercase() != "student" {
                return Err((StatusCode::NOT_FOUND, "学生不存在".to_string()));
            }

            match User::update(&pool, id, req).await {
                Ok(updated_user) => Ok(Json(updated_user)),
                Err(e) => {
                    eprintln!("更新学生失败: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "更新学生失败".to_string(),
                    ))
                }
            }
        }
        Ok(None) => Err((StatusCode::NOT_FOUND, "学生不存在".to_string())),
        Err(e) => {
            eprintln!("查找学生失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查找学生失败".to_string(),
            ))
        }
    }
}

/// 删除学生
pub async fn delete_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // 首先验证用户是否存在且为学生
    match User::find_by_id(&pool, id).await {
        Ok(Some(user)) => {
            if user.role.to_lowercase() != "student" {
                return Err((StatusCode::NOT_FOUND, "学生不存在".to_string()));
            }

            match User::delete(&pool, id).await {
                Ok(_) => Ok(StatusCode::NO_CONTENT),
                Err(e) => {
                    eprintln!("删除学生失败: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "删除学生失败".to_string(),
                    ))
                }
            }
        }
        Ok(None) => Err((StatusCode::NOT_FOUND, "学生不存在".to_string())),
        Err(e) => {
            eprintln!("查找学生失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查找学生失败".to_string(),
            ))
        }
    }
}

/// 获取特定年级的学生列表
pub async fn get_students_by_grade(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(grade): Path<i32>,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    match User::find_students_by_grade(&pool, grade).await {
        Ok(students) => Ok(Json(students)),
        Err(e) => {
            eprintln!("获取学生列表失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取学生列表失败".to_string(),
            ))
        }
    }
}

///获取所有学生列表
pub async fn get_all_students(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    match User::find_all_students(&pool).await {
        Ok(students) => Ok(Json(students)),
        Err(e) => {
            eprintln!("获取学生列表失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取学生列表失败".to_string(),
            ))
        }
    }
}
