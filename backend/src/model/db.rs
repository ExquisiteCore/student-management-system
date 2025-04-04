//! 数据库连接和初始化模块
//!
//! 提供数据库连接池和初始化功能

use sqlx::Row;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info, warn};

use crate::config::Config;

/// 获取数据库连接池
///
/// 尝试连接数据库，如果连接失败会进行重试
/// 最多重试3次，每次重试间隔时间递增
pub async fn get_db_pool(config: &Arc<Config>) -> Result<PgPool, sqlx::Error> {
    const MAX_RETRIES: u32 = 3;
    let mut retry_count = 0;
    let mut last_error = None;

    while retry_count < MAX_RETRIES {
        match PgPoolOptions::new()
            .max_connections(config.database.max_connections)
            .connect(&config.database.url)
            .await
        {
            Ok(pool) => {
                info!("数据库连接成功");
                if is_db_empty(&pool).await? {
                    init_db(&pool).await?
                }
                return Ok(pool);
            }
            Err(err) => {
                retry_count += 1;
                let retry_delay = Duration::from_secs(retry_count.into());

                match &err {
                    sqlx::Error::Database(db_err) => {
                        error!("数据库连接错误: {}, 错误代码: {:?}", db_err, db_err.code());
                    }
                    sqlx::Error::PoolTimedOut => {
                        error!("数据库连接池超时");
                    }
                    sqlx::Error::PoolClosed => {
                        error!("数据库连接池已关闭");
                    }
                    sqlx::Error::Configuration(config_err) => {
                        error!("数据库配置错误: {}", config_err);
                    }
                    sqlx::Error::Io(io_err) => {
                        error!("数据库IO错误: {}", io_err);
                    }
                    _ => {
                        error!("数据库连接错误: {}", err);
                    }
                }

                if retry_count < MAX_RETRIES {
                    warn!(
                        "尝试重新连接数据库，第{}次重试，等待{}秒...",
                        retry_count,
                        retry_delay.as_secs()
                    );
                    tokio::time::sleep(retry_delay).await;
                } else {
                    error!("数据库连接失败，已达到最大重试次数: {}", MAX_RETRIES);
                }

                last_error = Some(err);
            }
        }
    }

    // 所有重试都失败，返回最后一个错误
    Err(last_error.unwrap_or_else(|| sqlx::Error::Configuration("未知数据库连接错误".into())))
}

/// 初始化数据库
///
/// 如果数据库表不存在，则创建表
async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    info!("初始化数据库...");

    // 创建用户表（保留原有结构，role字段用于区分老师和学生）
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(100) NOT NULL,
            display_name VARCHAR(100),
            avatar_url TEXT,
            bio TEXT,
            role VARCHAR(20) NOT NULL DEFAULT 'student', -- 默认为学生角色，可以是'teacher'或'student'
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建学生表（包含基本信息和年级）
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS students (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            grade INT NOT NULL, -- 年级：1, 2, 3
            parent_name VARCHAR(100),
            parent_phone VARCHAR(20),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建课程表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS courses (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            keywords TEXT[], -- 课程关键词，用于检索
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建课程记录表（记录学生上课情况）
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS course_records (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            class_date DATE NOT NULL, -- 上课日期
            content TEXT NOT NULL, -- 上课内容
            performance TEXT, -- 上课表现
            teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建试卷表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS exams (
            id UUID PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            keywords TEXT[], -- 试卷关键词，用于检索
            file_path TEXT, -- 试卷文件路径
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建试卷记录表（记录学生做试卷情况）
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS exam_records (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            score DECIMAL(5,2), -- 分数
            completion_date DATE NOT NULL, -- 完成日期
            notes TEXT, -- 备注
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建作业表（记录学生上传的作业）
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS homework (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            file_path TEXT, -- 作业文件路径
            submission_date DATE NOT NULL, -- 提交日期
            grade VARCHAR(10), -- 评分
            feedback TEXT, -- 反馈
            teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    info!("数据库初始化完成");
    Ok(())
}

/// 检查数据库是否为空
///
/// 通过查询information_schema.tables表，检查是否存在应用程序使用的表
/// 如果没有找到这些表，则认为数据库是空的
async fn is_db_empty(pool: &PgPool) -> Result<bool, sqlx::Error> {
    info!("检查数据库是否为空...");

    // 查询数据库中是否存在我们的表
    let row = sqlx::query(
        "
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'students', 'courses', 'course_records', 'exams', 'exam_records', 'homework')
        ",
    )
    .fetch_one(pool)
    .await?;

    let count: i64 = row.get("count");

    // 如果count为0，表示数据库中没有我们的表，认为数据库是空的
    let is_empty = count == 0;

    info!("数据库是否为空: {}", is_empty);
    Ok(is_empty)
}
