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

use crate::model::models::student::{CreateStudentRequest, Student, UpdateStudentRequest};

/// 创建学生
pub async fn create_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateStudentRequest>,
) -> Result<Json<Student>, (StatusCode, String)> {
    match Student::create(&pool, req).await {
        Ok(student) => Ok(Json(student)),
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
) -> Result<Json<Student>, (StatusCode, String)> {
    match Student::find_by_id(&pool, id).await {
        Ok(Some(student)) => Ok(Json(student)),
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
    Json(req): Json<UpdateStudentRequest>,
) -> Result<Json<Student>, (StatusCode, String)> {
    match Student::update(&pool, id, req).await {
        Ok(student) => Ok(Json(student)),
        Err(e) => {
            eprintln!("更新学生失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新学生失败".to_string(),
            ))
        }
    }
}

/// 删除学生
pub async fn delete_student(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match Student::delete(&pool, id).await {
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

/// 获取特定年级的学生列表
pub async fn get_students_by_grade(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(grade): Path<i32>,
) -> Result<Json<Vec<Student>>, (StatusCode, String)> {
    match Student::find_by_grade(&pool, grade).await {
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
) -> Result<Json<Vec<Student>>, (StatusCode, String)> {
    match Student::find_all(&pool).await {
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
