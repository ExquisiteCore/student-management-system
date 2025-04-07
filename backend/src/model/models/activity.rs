//! 活动记录模型
//!
//! 提供系统活动记录的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 活动类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityType {
    /// 添加学生
    AddStudent,
    /// 更新学生
    UpdateStudent,
    /// 删除学生
    DeleteStudent,
    /// 添加课程
    AddCourse,
    /// 更新课程
    UpdateCourse,
    /// 删除课程
    DeleteCourse,
    /// 记录考勤
    RecordAttendance,
    /// 上传成绩
    UploadGrade,
    /// 其他操作
    Other,
}

impl AsRef<str> for ActivityType {
    fn as_ref(&self) -> &str {
        match self {
            ActivityType::AddStudent => "add_student",
            ActivityType::UpdateStudent => "update_student",
            ActivityType::DeleteStudent => "delete_student",
            ActivityType::AddCourse => "add_course",
            ActivityType::UpdateCourse => "update_course",
            ActivityType::DeleteCourse => "delete_course",
            ActivityType::RecordAttendance => "record_attendance",
            ActivityType::UploadGrade => "upload_grade",
            ActivityType::Other => "other",
        }
    }
}

impl From<String> for ActivityType {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "add_student" => ActivityType::AddStudent,
            "update_student" => ActivityType::UpdateStudent,
            "delete_student" => ActivityType::DeleteStudent,
            "add_course" => ActivityType::AddCourse,
            "update_course" => ActivityType::UpdateCourse,
            "delete_course" => ActivityType::DeleteCourse,
            "record_attendance" => ActivityType::RecordAttendance,
            "upload_grade" => ActivityType::UploadGrade,
            _ => ActivityType::Other,
        }
    }
}

/// 活动记录结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    /// 活动ID
    pub id: Uuid,
    /// 活动类型
    pub activity_type: String,
    /// 活动描述
    pub description: String,
    /// 操作用户ID
    pub user_id: Uuid,
    /// 操作用户名称
    pub user_name: String,
    /// 操作用户角色
    pub user_role: String,
    /// 相关资源ID（如学生ID、课程ID等）
    pub resource_id: Option<Uuid>,
    /// 创建时间
    pub created_at: OffsetDateTime,
}

/// 创建活动记录的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateActivityRequest {
    /// 活动类型
    pub activity_type: String,
    /// 活动描述
    pub description: String,
    /// 操作用户ID
    pub user_id: Uuid,
    /// 操作用户名称
    pub user_name: String,
    /// 操作用户角色
    pub user_role: String,
    /// 相关资源ID（如学生ID、课程ID等）
    pub resource_id: Option<Uuid>,
}

impl Activity {
    /// 创建新活动记录
    pub async fn create(pool: &PgPool, req: CreateActivityRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let activity = sqlx::query_as!(Self,
            r#"
            INSERT INTO activities (id, activity_type, description, user_id, user_name, user_role, resource_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, activity_type, description, user_id, user_name, user_role, resource_id, created_at
            "#,
            id,
            req.activity_type,
            req.description,
            req.user_id,
            req.user_name,
            req.user_role,
            req.resource_id,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(activity)
    }

    /// 获取所有活动记录，按创建时间倒序排列，并限制返回数量
    pub async fn find_all(pool: &PgPool, limit: i64) -> Result<Vec<Self>, Error> {
        let activities = sqlx::query_as!(Self,
            r#"
            SELECT id, activity_type, description, user_id, user_name, user_role, resource_id, created_at
            FROM activities
            ORDER BY created_at DESC
            LIMIT $1
            "#,
            limit
        )
        .fetch_all(pool)
        .await?;

        Ok(activities)
    }

    /// 根据用户ID获取活动记录
    pub async fn find_by_user_id(
        pool: &PgPool,
        user_id: Uuid,
        limit: i64,
    ) -> Result<Vec<Self>, Error> {
        let activities = sqlx::query_as!(Self,
            r#"
            SELECT id, activity_type, description, user_id, user_name, user_role, resource_id, created_at
            FROM activities
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            user_id,
            limit
        )
        .fetch_all(pool)
        .await?;

        Ok(activities)
    }

    /// 根据活动类型获取活动记录
    pub async fn find_by_activity_type(
        pool: &PgPool,
        activity_type: &str,
        limit: i64,
    ) -> Result<Vec<Self>, Error> {
        let activities = sqlx::query_as!(Self,
            r#"
            SELECT id, activity_type, description, user_id, user_name, user_role, resource_id, created_at
            FROM activities
            WHERE activity_type = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            activity_type,
            limit
        )
        .fetch_all(pool)
        .await?;

        Ok(activities)
    }
}
