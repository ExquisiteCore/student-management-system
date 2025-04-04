//! 课程API模块
//!
//! 提供课程和课程记录相关的API端点

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

use crate::model::models::course::{Course, CreateCourseRequest, UpdateCourseRequest};
use crate::model::models::course_record::{
    CourseRecord, CreateCourseRecordRequest, UpdateCourseRecordRequest,
};

// ===== 课程API =====

/// 创建课程
pub async fn create_course(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateCourseRequest>,
) -> Result<Json<Course>, (StatusCode, String)> {
    match Course::create(&pool, req).await {
        Ok(course) => Ok(Json(course)),
        Err(e) => {
            eprintln!("创建课程失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建课程失败".to_string(),
            ))
        }
    }
}

/// 获取课程信息
pub async fn get_course(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Course>, (StatusCode, String)> {
    match Course::find_by_id(&pool, id).await {
        Ok(Some(course)) => Ok(Json(course)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "课程不存在".to_string())),
        Err(e) => {
            eprintln!("获取课程失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取课程失败".to_string(),
            ))
        }
    }
}

/// 更新课程信息
pub async fn update_course(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCourseRequest>,
) -> Result<Json<Course>, (StatusCode, String)> {
    match Course::update(&pool, id, req).await {
        Ok(course) => Ok(Json(course)),
        Err(e) => {
            eprintln!("更新课程失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新课程失败".to_string(),
            ))
        }
    }
}

/// 删除课程
pub async fn delete_course(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match Course::delete(&pool, id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            eprintln!("删除课程失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "删除课程失败".to_string(),
            ))
        }
    }
}

/// 通过关键词查询课程
pub async fn search_courses_by_keyword(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(keyword): Path<String>,
) -> Result<Json<Vec<Course>>, (StatusCode, String)> {
    match Course::find_by_keyword(&pool, &keyword).await {
        Ok(courses) => Ok(Json(courses)),
        Err(e) => {
            eprintln!("查询课程失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询课程失败".to_string(),
            ))
        }
    }
}

// ===== 课程记录API =====

/// 创建课程记录
pub async fn create_course_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateCourseRecordRequest>,
) -> Result<Json<CourseRecord>, (StatusCode, String)> {
    match CourseRecord::create(&pool, req).await {
        Ok(record) => Ok(Json(record)),
        Err(e) => {
            eprintln!("创建课程记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建课程记录失败".to_string(),
            ))
        }
    }
}

/// 获取课程记录
pub async fn get_course_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<CourseRecord>, (StatusCode, String)> {
    match CourseRecord::find_by_id(&pool, id).await {
        Ok(Some(record)) => Ok(Json(record)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "课程记录不存在".to_string())),
        Err(e) => {
            eprintln!("获取课程记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取课程记录失败".to_string(),
            ))
        }
    }
}

/// 更新课程记录
pub async fn update_course_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCourseRecordRequest>,
) -> Result<Json<CourseRecord>, (StatusCode, String)> {
    match CourseRecord::update(&pool, id, req).await {
        Ok(record) => Ok(Json(record)),
        Err(e) => {
            eprintln!("更新课程记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新课程记录失败".to_string(),
            ))
        }
    }
}

/// 删除课程记录
pub async fn delete_course_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match CourseRecord::delete(&pool, id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            eprintln!("删除课程记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "删除课程记录失败".to_string(),
            ))
        }
    }
}

/// 查询参数结构体
#[derive(Debug, Deserialize)]
pub struct CourseRecordQuery {
    pub student_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub start_date: Option<Date>,
    pub end_date: Option<Date>,
    pub keyword: Option<String>,
}

/// 查询课程记录
pub async fn query_course_records(
    State(pool): State<Arc<Pool<Postgres>>>,
    Query(query): Query<CourseRecordQuery>,
) -> Result<Json<Vec<CourseRecord>>, (StatusCode, String)> {
    // 根据课程关键词查询学生的课程记录
    if let Some(keyword) = query.keyword {
        match CourseRecord::find_by_course_keyword(&pool, &keyword).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询课程记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询课程记录失败".to_string(),
                ));
            }
        }
    }

    // 根据学生ID查询课程记录
    if let Some(student_id) = query.student_id {
        match CourseRecord::find_by_student_id(&pool, student_id).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询课程记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询课程记录失败".to_string(),
                ));
            }
        }
    }

    // 根据课程ID查询课程记录
    if let Some(course_id) = query.course_id {
        match CourseRecord::find_by_course_id(&pool, course_id).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询课程记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询课程记录失败".to_string(),
                ));
            }
        }
    }

    // 根据日期范围查询课程记录
    if query.start_date.is_some() || query.end_date.is_some() {
        match CourseRecord::find_by_date_range(&pool, query.start_date, query.end_date).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询课程记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询课程记录失败".to_string(),
                ));
            }
        }
    }

    // 如果没有指定查询条件，返回所有记录
    match CourseRecord::find_all(&pool).await {
        Ok(records) => Ok(Json(records)),
        Err(e) => {
            eprintln!("查询课程记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询课程记录失败".to_string(),
            ))
        }
    }
}
