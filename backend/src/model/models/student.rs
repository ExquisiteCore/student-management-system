//! 学生模型
//!
//! 提供学生的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

use super::course_record::CourseRecord;
use super::exam_record::ExamRecord;
use super::homework::Homework;

/// 学生结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Student {
    /// 学生ID
    pub id: Uuid,
    /// 关联的用户ID
    pub user_id: Uuid,
    /// 年级
    pub grade: i32,
    /// 家长姓名
    pub parent_name: Option<String>,
    /// 家长电话
    pub parent_phone: Option<String>,
    /// 地址
    pub address: Option<String>,
    /// 备注
    pub notes: Option<String>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建学生的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateStudentRequest {
    /// 关联的用户ID
    pub user_id: Uuid,
    /// 年级
    pub grade: i32,
    /// 家长姓名
    pub parent_name: Option<String>,
    /// 家长电话
    pub parent_phone: Option<String>,
    /// 地址
    pub address: Option<String>,
    /// 备注
    pub notes: Option<String>,
}

/// 更新学生的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateStudentRequest {
    /// 年级
    pub grade: Option<i32>,
    /// 家长姓名
    pub parent_name: Option<String>,
    /// 家长电话
    pub parent_phone: Option<String>,
    /// 地址
    pub address: Option<String>,
    /// 备注
    pub notes: Option<String>,
}

/// 包含学生信息及其课程记录、作业和试卷记录的详细信息结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentWithDetails {
    /// 学生基本信息
    pub student: Student,
    /// 学生的课程记录列表
    pub course_records: Vec<CourseRecord>,
    /// 学生的作业列表
    pub homeworks: Vec<Homework>,
    /// 学生的试卷记录列表
    pub exam_records: Vec<ExamRecord>,
}

impl Student {
    /// 创建新学生
    pub async fn create(pool: &PgPool, req: CreateStudentRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let student = sqlx::query_as!(Self,
            r#"
            INSERT INTO students (id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
            "#,
            id,
            req.user_id,
            req.grade,
            req.parent_name,
            req.parent_phone,
            req.address,
            req.notes,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(student)
    }

    /// 根据ID查找学生
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let student = sqlx::query_as!(Self,
            r#"
            SELECT id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
            FROM students
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(student)
    }

    /// 根据用户ID查找学生
    pub async fn find_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Self>, Error> {
        let student = sqlx::query_as!(Self,
            r#"
            SELECT id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
            FROM students
            WHERE user_id = $1
            "#,
            user_id
        )
        .fetch_optional(pool)
        .await?;

        Ok(student)
    }

    /// 根据用户ID查找学生及其详细信息（包括课程记录、作业和试卷记录）
    pub async fn find_by_user_id_with_details(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<StudentWithDetails>, Error> {
        // 首先获取学生基本信息
        let student = Self::find_by_user_id(pool, user_id).await?;

        if let Some(student) = student {
            // 获取学生的课程记录
            let course_records = CourseRecord::find_by_student_id(pool, student.id).await?;

            // 获取学生的作业
            let homeworks = Homework::find_by_student_id(pool, student.id).await?;

            // 获取学生的试卷记录
            let exam_records = ExamRecord::find_by_student_id(pool, student.id).await?;

            Ok(Some(StudentWithDetails {
                student,
                course_records,
                homeworks,
                exam_records,
            }))
        } else {
            Ok(None)
        }
    }

    /// 获取所有学生
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let students = sqlx::query_as!(Self,
            r#"
            SELECT id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
            FROM students
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(students)
    }

    /// 按年级获取学生
    pub async fn find_by_grade(pool: &PgPool, grade: i32) -> Result<Vec<Self>, Error> {
        let students = sqlx::query_as!(Self,
            r#"
            SELECT id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
            FROM students
            WHERE grade = $1
            ORDER BY created_at DESC
            "#,
            grade
        )
        .fetch_all(pool)
        .await?;

        Ok(students)
    }

    /// 更新学生信息
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateStudentRequest) -> Result<Self, Error> {
        let student = Self::find_by_id(pool, id).await?;

        if let Some(student) = student {
            let grade = req.grade.unwrap_or(student.grade);
            let parent_name = req.parent_name.or(student.parent_name);
            let parent_phone = req.parent_phone.or(student.parent_phone);
            let address = req.address.or(student.address);
            let notes = req.notes.or(student.notes);
            let now = OffsetDateTime::now_utc();

            let updated_student = sqlx::query_as!(Self,
                r#"
                UPDATE students
                SET grade = $1, parent_name = $2, parent_phone = $3, address = $4, notes = $5, updated_at = $6
                WHERE id = $7
                RETURNING id, user_id, grade, parent_name, parent_phone, address, notes, created_at, updated_at
                "#,
                grade,
                parent_name,
                parent_phone,
                address,
                notes,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_student)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除学生
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM students WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
