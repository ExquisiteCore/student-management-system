//! 课程记录模型
//!
//! 提供课程记录的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::{Date, OffsetDateTime};
use uuid::Uuid;

/// 课程记录结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseRecord {
    /// 记录ID
    pub id: Uuid,
    /// 学生ID
    pub student_id: Uuid,
    /// 课程ID
    pub course_id: Uuid,
    /// 上课日期
    pub class_date: Date,
    /// 上课内容
    pub content: String,
    /// 上课表现
    pub performance: Option<String>,
    /// 教师ID
    pub teacher_id: Uuid,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建课程记录的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateCourseRecordRequest {
    /// 学生ID
    pub student_id: Uuid,
    /// 课程ID
    pub course_id: Uuid,
    /// 上课日期
    #[serde(deserialize_with = "deserialize_date")]
    pub class_date: Date,
    /// 上课内容
    pub content: String,
    /// 上课表现
    pub performance: Option<String>,
    /// 教师ID
    pub teacher_id: Uuid,
}

fn deserialize_date<'de, D>(deserializer: D) -> Result<Date, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    let format = time::macros::format_description!("[year]-[month]-[day]");
    Date::parse(&s, &format).map_err(serde::de::Error::custom)
}

/// 更新课程记录的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateCourseRecordRequest {
    /// 学生ID
    pub student_id: Option<Uuid>,
    /// 课程ID
    pub course_id: Option<Uuid>,
    /// 上课日期
    pub class_date: Option<Date>,
    /// 上课内容
    pub content: Option<String>,
    /// 上课表现
    pub performance: Option<String>,
    /// 教师ID
    pub teacher_id: Option<Uuid>,
}

impl CourseRecord {
    /// 创建新课程记录
    pub async fn create(pool: &PgPool, req: CreateCourseRecordRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let record = sqlx::query_as!(Self,
            r#"
            INSERT INTO course_records (id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            "#,
            id,
            req.student_id,
            req.course_id,
            req.class_date,
            req.content,
            req.performance,
            req.teacher_id,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(record)
    }

    /// 根据ID查找课程记录
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let record = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(record)
    }

    /// 根据学生ID查找课程记录
    pub async fn find_by_student_id(pool: &PgPool, student_id: Uuid) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            WHERE student_id = $1
            ORDER BY class_date DESC
            "#,
            student_id
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 根据课程ID查找课程记录
    pub async fn find_by_course_id(pool: &PgPool, course_id: Uuid) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            WHERE course_id = $1
            ORDER BY class_date DESC
            "#,
            course_id
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 根据教师ID查找课程记录
    pub async fn find_by_teacher_id(pool: &PgPool, teacher_id: Uuid) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            WHERE teacher_id = $1
            ORDER BY class_date DESC
            "#,
            teacher_id
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 获取所有课程记录
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            ORDER BY class_date DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 更新课程记录
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        req: UpdateCourseRecordRequest,
    ) -> Result<Self, Error> {
        let record = Self::find_by_id(pool, id).await?;

        if let Some(record) = record {
            let student_id = req.student_id.unwrap_or(record.student_id);
            let course_id = req.course_id.unwrap_or(record.course_id);
            let class_date = req.class_date.unwrap_or(record.class_date);
            let content = req.content.unwrap_or(record.content);
            let performance = req.performance.or(record.performance);
            let teacher_id = req.teacher_id.unwrap_or(record.teacher_id);
            let now = OffsetDateTime::now_utc();

            let updated_record = sqlx::query_as!(Self,
                r#"
                UPDATE course_records
                SET student_id = $1, course_id = $2, class_date = $3, content = $4, performance = $5, teacher_id = $6, updated_at = $7
                WHERE id = $8
                RETURNING id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
                "#,
                student_id,
                course_id,
                class_date,
                content,
                performance,
                teacher_id,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_record)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除课程记录
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM course_records WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 根据日期范围查找课程记录
    pub async fn find_by_date_range(
        pool: &PgPool,
        start_date: Option<Date>,
        end_date: Option<Date>,
    ) -> Result<Vec<Self>, Error> {
        let records = match (start_date, end_date) {
            (Some(start), Some(end)) => {
                sqlx::query_as!(
                    Self,
                    r#"
                    SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
                    FROM course_records
                    WHERE class_date >= $1 AND class_date <= $2
                    ORDER BY class_date DESC
                    "#,
                    start,
                    end
                )
                .fetch_all(pool)
                .await?
            },
            (Some(start), None) => {
                sqlx::query_as!(
                    Self,
                    r#"
                    SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
                    FROM course_records
                    WHERE class_date >= $1
                    ORDER BY class_date DESC
                    "#,
                    start
                )
                .fetch_all(pool)
                .await?
            },
            (None, Some(end)) => {
                sqlx::query_as!(
                    Self,
                    r#"
                    SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
                    FROM course_records
                    WHERE class_date <= $1
                    ORDER BY class_date DESC
                    "#,
                    end
                )
                .fetch_all(pool)
                .await?
            },
            (None, None) => {
                return Self::find_all(pool).await;
            }
        };

        Ok(records)
    }

    /// 根据课程关键词查找课程记录
    pub async fn find_by_course_keyword(pool: &PgPool, keyword: &str) -> Result<Vec<Self>, Error> {
        // 先查询与关键词匹配的课程
        let courses = sqlx::query!(
            r#"
            SELECT id
            FROM courses
            WHERE name ILIKE $1 OR description ILIKE $1
            "#,
            format!("%{}%", keyword)
        )
        .fetch_all(pool)
        .await?;

        // 如果没有找到匹配的课程，返回空列表
        if courses.is_empty() {
            return Ok(Vec::new());
        }

        // 提取课程ID
        let course_ids: Vec<Uuid> = courses.into_iter().map(|c| c.id).collect();

        // 查询这些课程的记录
        let records = sqlx::query_as!(
            Self,
            r#"
            SELECT id, student_id, course_id, class_date, content, performance, teacher_id, created_at, updated_at
            FROM course_records
            WHERE course_id = ANY($1)
            ORDER BY class_date DESC
            "#,
            &course_ids
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }
}
