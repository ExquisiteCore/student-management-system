//! 试卷API模块
//!
//! 提供试卷和试卷记录相关的API端点

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

use crate::model::models::exam::{CreateExamRequest, Exam, UpdateExamRequest};
use crate::model::models::exam_record::{
    CreateExamRecordRequest, ExamRecord, UpdateExamRecordRequest,
};

// ===== 试卷API =====

/// 创建试卷
pub async fn create_exam(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateExamRequest>,
) -> Result<Json<Exam>, (StatusCode, String)> {
    match Exam::create(&pool, req).await {
        Ok(exam) => Ok(Json(exam)),
        Err(e) => {
            eprintln!("创建试卷失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建试卷失败".to_string(),
            ))
        }
    }
}

/// 获取试卷信息
pub async fn get_exam(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Exam>, (StatusCode, String)> {
    match Exam::find_by_id(&pool, id).await {
        Ok(Some(exam)) => Ok(Json(exam)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "试卷不存在".to_string())),
        Err(e) => {
            eprintln!("获取试卷失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取试卷失败".to_string(),
            ))
        }
    }
}

/// 更新试卷信息
pub async fn update_exam(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateExamRequest>,
) -> Result<Json<Exam>, (StatusCode, String)> {
    match Exam::update(&pool, id, req).await {
        Ok(exam) => Ok(Json(exam)),
        Err(e) => {
            eprintln!("更新试卷失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新试卷失败".to_string(),
            ))
        }
    }
}

/// 删除试卷
pub async fn delete_exam(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match Exam::delete(&pool, id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            eprintln!("删除试卷失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "删除试卷失败".to_string(),
            ))
        }
    }
}

/// 通过关键词查询试卷
pub async fn search_exams_by_keyword(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(keyword): Path<String>,
) -> Result<Json<Vec<Exam>>, (StatusCode, String)> {
    match Exam::find_by_keyword(&pool, &keyword).await {
        Ok(exams) => Ok(Json(exams)),
        Err(e) => {
            eprintln!("查询试卷失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询试卷失败".to_string(),
            ))
        }
    }
}

// ===== 试卷记录API =====

/// 创建试卷记录
pub async fn create_exam_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateExamRecordRequest>,
) -> Result<Json<ExamRecord>, (StatusCode, String)> {
    match ExamRecord::create(&pool, req).await {
        Ok(record) => Ok(Json(record)),
        Err(e) => {
            eprintln!("创建试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "创建试卷记录失败".to_string(),
            ))
        }
    }
}

/// 获取试卷记录
pub async fn get_exam_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ExamRecord>, (StatusCode, String)> {
    match ExamRecord::find_by_id(&pool, id).await {
        Ok(Some(record)) => Ok(Json(record)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "试卷记录不存在".to_string())),
        Err(e) => {
            eprintln!("获取试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "获取试卷记录失败".to_string(),
            ))
        }
    }
}

/// 更新试卷记录
pub async fn update_exam_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateExamRecordRequest>,
) -> Result<Json<ExamRecord>, (StatusCode, String)> {
    match ExamRecord::update(&pool, id, req).await {
        Ok(record) => Ok(Json(record)),
        Err(e) => {
            eprintln!("更新试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "更新试卷记录失败".to_string(),
            ))
        }
    }
}

/// 删除试卷记录
pub async fn delete_exam_record(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match ExamRecord::delete(&pool, id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            eprintln!("删除试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "删除试卷记录失败".to_string(),
            ))
        }
    }
}

/// 查询参数结构体
#[derive(Debug, Deserialize)]
pub struct ExamRecordQuery {
    pub student_id: Option<Uuid>,
    pub exam_id: Option<Uuid>,
    pub start_date: Option<Date>,
    pub end_date: Option<Date>,
}

/// 查询试卷记录
pub async fn query_exam_records(
    State(pool): State<Arc<Pool<Postgres>>>,
    Query(query): Query<ExamRecordQuery>,
) -> Result<Json<Vec<ExamRecord>>, (StatusCode, String)> {
    // 根据学生ID查询试卷记录
    if let Some(student_id) = query.student_id {
        match ExamRecord::find_by_student_id(&pool, student_id).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询试卷记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询试卷记录失败".to_string(),
                ));
            }
        }
    }

    // 根据试卷ID查询试卷记录 - 查询做了该试卷的学生
    if let Some(exam_id) = query.exam_id {
        match ExamRecord::find_by_exam_id(&pool, exam_id).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询试卷记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询试卷记录失败".to_string(),
                ));
            }
        }
    }

    // 根据日期范围查询试卷记录
    if query.start_date.is_some() || query.end_date.is_some() {
        match ExamRecord::find_by_date_range(&pool, query.start_date, query.end_date).await {
            Ok(records) => return Ok(Json(records)),
            Err(e) => {
                eprintln!("查询试卷记录失败: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "查询试卷记录失败".to_string(),
                ));
            }
        }
    }

    // 如果没有指定查询条件，返回所有记录
    match ExamRecord::find_all(&pool).await {
        Ok(records) => Ok(Json(records)),
        Err(e) => {
            eprintln!("查询试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询试卷记录失败".to_string(),
            ))
        }
    }
}

//获取所有试卷记录
pub async fn get_all_exam_records(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<ExamRecord>>, (StatusCode, String)> {
    match ExamRecord::find_all(&pool).await {
        Ok(records) => Ok(Json(records)),
        Err(e) => {
            eprintln!("查询试卷记录失败: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "查询试卷记录失败".to_string(),
            ))
        }
    }
}
