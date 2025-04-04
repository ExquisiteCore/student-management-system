//! 作业模型
//!
//! 提供作业的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::{Date, OffsetDateTime};
use uuid::Uuid;

/// 作业结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Homework {
    /// 作业ID
    pub id: Uuid,
    /// 学生ID
    pub student_id: Uuid,
    /// 作业标题
    pub title: String,
    /// 作业描述
    pub description: Option<String>,
    /// 作业文件路径
    pub file_path: Option<String>,
    /// 提交日期
    pub submission_date: Date,
    /// 评分
    pub grade: Option<String>,
    /// 反馈
    pub feedback: Option<String>,
    /// 教师ID
    pub teacher_id: Option<Uuid>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建作业的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateHomeworkRequest {
    /// 学生ID
    pub student_id: Uuid,
    /// 作业标题
    pub title: String,
    /// 作业描述
    pub description: Option<String>,
    /// 作业文件路径
    pub file_path: Option<String>,
    /// 提交日期
    pub submission_date: Date,
    /// 评分
    pub grade: Option<String>,
    /// 反馈
    pub feedback: Option<String>,
    /// 教师ID
    pub teacher_id: Option<Uuid>,
}

/// 更新作业的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateHomeworkRequest {
    /// 作业标题
    pub title: Option<String>,
    /// 作业描述
    pub description: Option<String>,
    /// 作业文件路径
    pub file_path: Option<String>,
    /// 提交日期
    pub submission_date: Option<Date>,
    /// 评分
    pub grade: Option<String>,
    /// 反馈
    pub feedback: Option<String>,
    /// 教师ID
    pub teacher_id: Option<Uuid>,
}

impl Homework {
    /// 创建新作业
    pub async fn create(pool: &PgPool, req: CreateHomeworkRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let homework = sqlx::query_as!(Self,
            r#"
            INSERT INTO homework (id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
            "#,
            id,
            req.student_id,
            req.title,
            req.description,
            req.file_path,
            req.submission_date,
            req.grade,
            req.feedback,
            req.teacher_id,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(homework)
    }

    /// 根据ID查找作业
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let homework = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
            FROM homework
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(homework)
    }

    /// 根据学生ID查找作业
    pub async fn find_by_student_id(pool: &PgPool, student_id: Uuid) -> Result<Vec<Self>, Error> {
        let homeworks = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
            FROM homework
            WHERE student_id = $1
            ORDER BY submission_date DESC
            "#,
            student_id
        )
        .fetch_all(pool)
        .await?;

        Ok(homeworks)
    }

    /// 根据教师ID查找作业
    pub async fn find_by_teacher_id(pool: &PgPool, teacher_id: Uuid) -> Result<Vec<Self>, Error> {
        let homeworks = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
            FROM homework
            WHERE teacher_id = $1
            ORDER BY submission_date DESC
            "#,
            teacher_id
        )
        .fetch_all(pool)
        .await?;

        Ok(homeworks)
    }

    /// 获取所有作业
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let homeworks = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
            FROM homework
            ORDER BY submission_date DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(homeworks)
    }

    /// 更新作业
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        req: UpdateHomeworkRequest,
    ) -> Result<Self, Error> {
        let homework = Self::find_by_id(pool, id).await?;

        if let Some(homework) = homework {
            let title = req.title.unwrap_or(homework.title);
            let description = req.description.or(homework.description);
            let file_path = req.file_path.or(homework.file_path);
            let submission_date = req.submission_date.unwrap_or(homework.submission_date);
            let grade = req.grade.or(homework.grade);
            let feedback = req.feedback.or(homework.feedback);
            let teacher_id = req.teacher_id.or(homework.teacher_id);
            let now = OffsetDateTime::now_utc();

            let updated_homework = sqlx::query_as!(Self,
                r#"
                UPDATE homework
                SET title = $1, description = $2, file_path = $3, submission_date = $4, grade = $5, feedback = $6, teacher_id = $7, updated_at = $8
                WHERE id = $9
                RETURNING id, student_id, title, description, file_path, submission_date, grade, feedback, teacher_id, created_at, updated_at
                "#,
                title,
                description,
                file_path,
                submission_date,
                grade,
                feedback,
                teacher_id,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_homework)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除作业
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM homework WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
