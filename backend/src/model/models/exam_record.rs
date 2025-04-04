//! 试卷记录模型
//!
//! 提供试卷记录的数据结构和数据库操作方法

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::{Date, OffsetDateTime};
use uuid::Uuid;

/// 试卷记录结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExamRecord {
    /// 记录ID
    pub id: Uuid,
    /// 学生ID
    pub student_id: Uuid,
    /// 试卷ID
    pub exam_id: Uuid,
    /// 分数
    pub score: Option<Decimal>,
    /// 完成日期
    pub completion_date: Date,
    /// 备注
    pub notes: Option<String>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建试卷记录的请求数据结构
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateExamRecordRequest {
    /// 学生ID
    pub student_id: Uuid,
    /// 试卷ID
    pub exam_id: Uuid,
    /// 分数
    pub score: Option<Decimal>,
    /// 完成日期
    pub completion_date: Date,
    /// 备注
    pub notes: Option<String>,
}

/// 更新试卷记录的请求数据结构
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateExamRecordRequest {
    /// 学生ID
    pub student_id: Option<Uuid>,
    /// 试卷ID
    pub exam_id: Option<Uuid>,
    /// 分数
    pub score: Option<Decimal>,
    /// 完成日期
    pub completion_date: Option<Date>,
    /// 备注
    pub notes: Option<String>,
}

impl ExamRecord {
    /// 创建新试卷记录
    pub async fn create(pool: &PgPool, req: CreateExamRecordRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let record = sqlx::query_as!(Self,
            r#"
            INSERT INTO exam_records (id, student_id, exam_id, score, completion_date, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
            "#,
            id,
            req.student_id,
            req.exam_id,
            req.score,
            req.completion_date,
            req.notes,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(record)
    }

    /// 根据ID查找试卷记录
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let record = sqlx::query_as!(
            Self,
            r#"
            SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
            FROM exam_records
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(record)
    }

    /// 根据学生ID查找试卷记录
    pub async fn find_by_student_id(pool: &PgPool, student_id: Uuid) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(
            Self,
            r#"
            SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
            FROM exam_records
            WHERE student_id = $1
            ORDER BY completion_date DESC
            "#,
            student_id
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 根据试卷ID查找试卷记录
    pub async fn find_by_exam_id(pool: &PgPool, exam_id: Uuid) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(
            Self,
            r#"
            SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
            FROM exam_records
            WHERE exam_id = $1
            ORDER BY completion_date DESC
            "#,
            exam_id
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 获取所有试卷记录
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let records = sqlx::query_as!(
            Self,
            r#"
            SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
            FROM exam_records
            ORDER BY completion_date DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(records)
    }

    /// 更新试卷记录
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        req: UpdateExamRecordRequest,
    ) -> Result<Self, Error> {
        let record = Self::find_by_id(pool, id).await?;

        if let Some(record) = record {
            let student_id = req.student_id.unwrap_or(record.student_id);
            let exam_id = req.exam_id.unwrap_or(record.exam_id);
            let score = req.score.or(record.score);
            let completion_date = req.completion_date.unwrap_or(record.completion_date);
            let notes = req.notes.or(record.notes);
            let now = OffsetDateTime::now_utc();

            let updated_record = sqlx::query_as!(Self,
                r#"
                UPDATE exam_records
                SET student_id = $1, exam_id = $2, score = $3, completion_date = $4, notes = $5, updated_at = $6
                WHERE id = $7
                RETURNING id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
                "#,
                student_id,
                exam_id,
                score,
                completion_date,
                notes,
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

    /// 删除试卷记录
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM exam_records WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 根据日期范围查找试卷记录
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
                    SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
                    FROM exam_records
                    WHERE completion_date >= $1 AND completion_date <= $2
                    ORDER BY completion_date DESC
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
                    SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
                    FROM exam_records
                    WHERE completion_date >= $1
                    ORDER BY completion_date DESC
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
                    SELECT id, student_id, exam_id, score, completion_date, notes, created_at, updated_at
                    FROM exam_records
                    WHERE completion_date <= $1
                    ORDER BY completion_date DESC
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
}
