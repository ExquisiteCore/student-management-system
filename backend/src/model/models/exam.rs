//! 试卷模型
//!
//! 提供试卷的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 试卷结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Exam {
    /// 试卷ID
    pub id: Uuid,
    /// 试卷标题
    pub title: String,
    /// 试卷描述
    pub description: Option<String>,
    /// 试卷关键词
    pub keywords: Option<Vec<String>>,
    /// 试卷文件路径
    pub file_path: Option<String>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建试卷的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateExamRequest {
    /// 试卷标题
    pub title: String,
    /// 试卷描述
    pub description: Option<String>,
    /// 试卷关键词
    pub keywords: Option<Vec<String>>,
    /// 试卷文件路径
    pub file_path: Option<String>,
}

/// 更新试卷的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateExamRequest {
    /// 试卷标题
    pub title: Option<String>,
    /// 试卷描述
    pub description: Option<String>,
    /// 试卷关键词
    pub keywords: Option<Vec<String>>,
    /// 试卷文件路径
    pub file_path: Option<String>,
}

impl Exam {
    /// 创建新试卷
    pub async fn create(pool: &PgPool, req: CreateExamRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let exam = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO exams (id, title, description, keywords, file_path, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, title, description, keywords, file_path, created_at, updated_at
            "#,
            id,
            req.title,
            req.description,
            req.keywords.as_ref().map(|k| k.as_slice()),
            req.file_path,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(exam)
    }

    /// 根据ID查找试卷
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let exam = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, description, keywords, file_path, created_at, updated_at
            FROM exams
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(exam)
    }

    /// 根据标题查找试卷
    pub async fn find_by_title(pool: &PgPool, title: &str) -> Result<Option<Self>, Error> {
        let exam = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, description, keywords, file_path, created_at, updated_at
            FROM exams
            WHERE title = $1
            "#,
            title
        )
        .fetch_optional(pool)
        .await?;

        Ok(exam)
    }

    /// 根据关键词查找试卷
    pub async fn find_by_keyword(pool: &PgPool, keyword: &str) -> Result<Vec<Self>, Error> {
        let exams = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, description, keywords, file_path, created_at, updated_at
            FROM exams
            WHERE $1 = ANY(keywords)
            ORDER BY title ASC
            "#,
            keyword
        )
        .fetch_all(pool)
        .await?;

        Ok(exams)
    }

    /// 获取所有试卷
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let exams = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, description, keywords, file_path, created_at, updated_at
            FROM exams
            ORDER BY title ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(exams)
    }

    /// 更新试卷
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateExamRequest) -> Result<Self, Error> {
        let exam = Self::find_by_id(pool, id).await?;

        if let Some(exam) = exam {
            let title = req.title.unwrap_or(exam.title);
            let description = req.description.or(exam.description);
            let keywords = req.keywords.or(exam.keywords);
            let file_path = req.file_path.or(exam.file_path);
            let now = OffsetDateTime::now_utc();

            let updated_exam = sqlx::query_as!(
                Self,
                r#"
                UPDATE exams
                SET title = $1, description = $2, keywords = $3, file_path = $4, updated_at = $5
                WHERE id = $6
                RETURNING id, title, description, keywords, file_path, created_at, updated_at
                "#,
                title,
                description,
                keywords.as_ref().map(|k| k.as_slice()),
                file_path,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_exam)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除试卷
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM exams WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
