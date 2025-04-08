//! 作业API模块
//!
//! 提供作业相关的API端点

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use serde::Deserialize;
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use time::Date;
use uuid::Uuid;

use crate::model::models::homework::{CreateHomeworkRequest, Homework, UpdateHomeworkRequest};

/// 创建作业
pub async fn create_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateHomeworkRequest>,
) -> Result<Json<Homework>, (StatusCode, String)> {
    match Homework::create(&pool, req).await {
        Ok(homework) => Ok(Json(homework)),
        Err(e) => {
            eprintln!("创建作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建作业失败".to_string(),
            ))
        }
    }
}

/// 获取作业信息
pub async fn get_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Homework>, (StatusCode, String)> {
    match Homework::find_by_id(&pool, id).await {
        Ok(Some(homework)) => Ok(Json(homework)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "作业不存在".to_string())),
        Err(e) => {
            eprintln!("获取作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取作业失败".to_string(),
            ))
        }
    }
}

/// 更新作业信息
pub async fn update_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateHomeworkRequest>,
) -> Result<Json<Homework>, (StatusCode, String)> {
    match Homework::update(&pool, id, req).await {
        Ok(homework) => Ok(Json(homework)),
        Err(e) => {
            eprintln!("更新作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新作业失败".to_string(),
            ))
        }
    }
}

/// 删除作业
pub async fn delete_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match Homework::delete(&pool, id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            eprintln!("删除作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "删除作业失败".to_string(),
            ))
        }
    }
}

/// 查询参数结构体
#[derive(Debug, Deserialize)]
pub struct HomeworkQuery {
    pub student_id: Option<Uuid>,
    pub teacher_id: Option<Uuid>,
    pub start_date: Option<Date>,
    pub end_date: Option<Date>,
    pub title: Option<String>,
}

/// 查询作业
pub async fn query_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Query(query): Query<HomeworkQuery>,
) -> Result<Json<Vec<Homework>>, (StatusCode, String)> {
    // 根据学生ID查询作业
    if let Some(student_id) = query.student_id {
        match Homework::find_by_student_id(&pool, student_id).await {
            Ok(homework) => return Ok(Json(homework)),
            Err(e) => {
                eprintln!("查询作业失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询作业失败".to_string(),
                ));
            }
        }
    }

    // 根据教师ID查询作业
    if let Some(teacher_id) = query.teacher_id {
        match Homework::find_by_teacher_id(&pool, teacher_id).await {
            Ok(homework) => return Ok(Json(homework)),
            Err(e) => {
                eprintln!("查询作业失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询作业失败".to_string(),
                ));
            }
        }
    }

    // 根据标题查询作业
    if let Some(title) = &query.title {
        match Homework::find_by_title(&pool, title).await {
            Ok(homework) => return Ok(Json(homework)),
            Err(e) => {
                eprintln!("查询作业失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询作业失败".to_string(),
                ));
            }
        }
    }

    // 根据日期范围查询作业
    if query.start_date.is_some() || query.end_date.is_some() {
        match Homework::find_by_date_range(&pool, query.start_date, query.end_date).await {
            Ok(homework) => return Ok(Json(homework)),
            Err(e) => {
                eprintln!("查询作业失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询作业失败".to_string(),
                ));
            }
        }
    }

    // 如果没有指定查询条件，返回所有作业
    match Homework::find_all(&pool).await {
        Ok(homework) => Ok(Json(homework)),
        Err(e) => {
            eprintln!("查询作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询作业失败".to_string(),
            ))
        }
    }
}

/// 教师评分作业
pub async fn grade_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateHomeworkRequest>,
) -> Result<Json<Homework>, (StatusCode, String)> {
    // 确保请求中包含评分和反馈
    if req.grade.is_none() && req.feedback.is_none() {
        return Err((StatusCode::BAD_REQUEST, "评分或反馈不能为空".to_string()));
    }

    match Homework::update(&pool, id, req).await {
        Ok(homework) => Ok(Json(homework)),
        Err(e) => {
            eprintln!("评分作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "评分作业失败".to_string(),
            ))
        }
    }
}

//获取所有作业
pub async fn get_all_homework(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<Homework>>, (StatusCode, String)> {
    match Homework::find_all(&pool).await {
        Ok(homework) => Ok(Json(homework)),
        Err(e) => {
            eprintln!("获取所有作业失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取所有作业失败".to_string(),
            ))
        }
    }
}
