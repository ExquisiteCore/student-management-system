//! 课程模型
//!
//! 提供课程的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 课程结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Course {
    /// 课程ID
    pub id: Uuid,
    /// 课程名称
    pub name: String,
    /// 课程描述
    pub description: Option<String>,
    /// 课程关键词
    pub keywords: Option<Vec<String>>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建课程的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateCourseRequest {
    /// 课程名称
    pub name: String,
    /// 课程描述
    pub description: Option<String>,
    /// 课程关键词
    pub keywords: Option<Vec<String>>,
}

/// 更新课程的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateCourseRequest {
    /// 课程名称
    pub name: Option<String>,
    /// 课程描述
    pub description: Option<String>,
    /// 课程关键词
    pub keywords: Option<Vec<String>>,
}

impl Course {
    /// 创建新课程
    pub async fn create(pool: &PgPool, req: CreateCourseRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let course = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO courses (id, name, description, keywords, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, description, keywords, created_at, updated_at
            "#,
            id,
            req.name,
            req.description,
            req.keywords.as_ref().map(|k| k.as_slice()),
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(course)
    }

    /// 根据ID查找课程
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let course = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, description, keywords, created_at, updated_at
            FROM courses
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(course)
    }

    /// 根据名称查找课程
    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<Self>, Error> {
        let course = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, description, keywords, created_at, updated_at
            FROM courses
            WHERE name = $1
            "#,
            name
        )
        .fetch_optional(pool)
        .await?;

        Ok(course)
    }

    /// 根据关键词查找课程
    pub async fn find_by_keyword(pool: &PgPool, keyword: &str) -> Result<Vec<Self>, Error> {
        let courses = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, description, keywords, created_at, updated_at
            FROM courses
            WHERE $1 = ANY(keywords)
            ORDER BY name ASC
            "#,
            keyword
        )
        .fetch_all(pool)
        .await?;

        Ok(courses)
    }

    /// 获取所有课程
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let courses = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, description, keywords, created_at, updated_at
            FROM courses
            ORDER BY name ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(courses)
    }

    /// 更新课程
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateCourseRequest) -> Result<Self, Error> {
        let course = Self::find_by_id(pool, id).await?;

        if let Some(course) = course {
            let name = req.name.unwrap_or(course.name);
            let description = req.description.or(course.description);
            let keywords = req.keywords.or(course.keywords);
            let now = OffsetDateTime::now_utc();

            let updated_course = sqlx::query_as!(
                Self,
                r#"
                UPDATE courses
                SET name = $1, description = $2, keywords = $3, updated_at = $4
                WHERE id = $5
                RETURNING id, name, description, keywords, created_at, updated_at
                "#,
                name,
                description,
                keywords.as_ref().map(|k| k.as_slice()),
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_course)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除课程
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM courses WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
