//! 系统公告模型
//!
//! 提供系统公告的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 公告结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Announcement {
    /// 公告ID
    pub id: Uuid,
    /// 公告标题
    pub title: String,
    /// 公告内容
    pub content: String,
    /// 发布者ID
    pub publisher_id: Uuid,
    /// 发布者名称
    pub publisher_name: String,
    /// 发布者角色
    pub publisher_role: String,
    /// 是否重要
    pub is_important: bool,
    /// 发布时间
    pub published_at: OffsetDateTime,
    /// 过期时间（可选）
    pub expired_at: Option<OffsetDateTime>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建公告的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateAnnouncementRequest {
    /// 公告标题
    pub title: String,
    /// 公告内容
    pub content: String,
    /// 发布者ID
    pub publisher_id: Uuid,
    /// 发布者名称
    pub publisher_name: String,
    /// 发布者角色
    pub publisher_role: String,
    /// 是否重要
    pub is_important: bool,
    /// 过期时间（可选）
    pub expired_at: Option<OffsetDateTime>,
}

/// 更新公告的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateAnnouncementRequest {
    /// 公告标题
    pub title: Option<String>,
    /// 公告内容
    pub content: Option<String>,
    /// 是否重要
    pub is_important: Option<bool>,
    /// 过期时间
    pub expired_at: Option<OffsetDateTime>,
}

impl Announcement {
    /// 创建新公告
    pub async fn create(pool: &PgPool, req: CreateAnnouncementRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let announcement = sqlx::query_as!(Self,
            r#"
            INSERT INTO announcements (id, title, content, publisher_id, publisher_name, publisher_role, is_important, published_at, expired_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title, content, publisher_id, publisher_name, publisher_role, is_important, published_at, expired_at, created_at, updated_at
            "#,
            id,
            req.title,
            req.content,
            req.publisher_id,
            req.publisher_name,
            req.publisher_role,
            req.is_important,
            now,
            req.expired_at,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(announcement)
    }

    /// 获取所有有效的公告，按发布时间倒序排列
    pub async fn find_all(pool: &PgPool, limit: i64) -> Result<Vec<Self>, Error> {
        let now = OffsetDateTime::now_utc();

        let announcements = sqlx::query_as!(Self,
            r#"
            SELECT id, title, content, publisher_id, publisher_name, publisher_role, is_important, published_at, expired_at, created_at, updated_at
            FROM announcements
            WHERE expired_at IS NULL OR expired_at > $1
            ORDER BY is_important DESC, published_at DESC
            LIMIT $2
            "#,
            now,
            limit
        )
        .fetch_all(pool)
        .await?;

        Ok(announcements)
    }

    /// 根据ID获取公告
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Self, Error> {
        let announcement = sqlx::query_as!(Self,
            r#"
            SELECT id, title, content, publisher_id, publisher_name, publisher_role, is_important, published_at, expired_at, created_at, updated_at
            FROM announcements
            WHERE id = $1
            "#,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(announcement)
    }

    /// 更新公告
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        req: UpdateAnnouncementRequest,
    ) -> Result<Self, Error> {
        let now = OffsetDateTime::now_utc();

        // 先获取现有公告
        let current = Self::find_by_id(pool, id).await?;

        // 更新字段
        let title = req.title.unwrap_or(current.title);
        let content = req.content.unwrap_or(current.content);
        let is_important = req.is_important.unwrap_or(current.is_important);
        let expired_at = req.expired_at.or(current.expired_at);

        let announcement = sqlx::query_as!(Self,
            r#"
            UPDATE announcements
            SET title = $1, content = $2, is_important = $3, expired_at = $4, updated_at = $5
            WHERE id = $6
            RETURNING id, title, content, publisher_id, publisher_name, publisher_role, is_important, published_at, expired_at, created_at, updated_at
            "#,
            title,
            content,
            is_important,
            expired_at,
            now,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(announcement)
    }

    /// 删除公告
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), Error> {
        sqlx::query!("DELETE FROM announcements WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(())
    }
}
