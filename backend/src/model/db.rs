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

    // 创建用户表 - 修改role字段以区分学生和老师
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
            role VARCHAR(20) NOT NULL DEFAULT 'student', -- 默认为学生角色，可选值：student, teacher, admin
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建学生基本信息表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS student_info (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            grade INT NOT NULL, -- 年级：1, 2, 3
            class_name VARCHAR(50), -- 班级名称
            parent_name VARCHAR(100), -- 家长姓名
            parent_phone VARCHAR(20), -- 家长电话
            address TEXT, -- 家庭住址
            notes TEXT, -- 备注信息
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建课程记录表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS course_records (
            id UUID PRIMARY KEY,
            date DATE NOT NULL, -- 上课日期
            title VARCHAR(200) NOT NULL, -- 课程标题
            content TEXT NOT NULL, -- 课程内容
            keywords TEXT[], -- 课程关键词，用于检索
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建学生课程记录关联表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS student_course_records (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES student_info(id) ON DELETE CASCADE,
            course_record_id UUID NOT NULL REFERENCES course_records(id) ON DELETE CASCADE,
            performance TEXT, -- 学生上课表现
            notes TEXT, -- 备注信息
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(student_id, course_record_id)
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
            title VARCHAR(200) NOT NULL, -- 试卷标题
            description TEXT, -- 试卷描述
            grade INT NOT NULL, -- 适用年级
            keywords TEXT[], -- 试卷关键词，用于检索
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建学生试卷记录表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS student_exam_records (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES student_info(id) ON DELETE CASCADE,
            exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            score DECIMAL(5,2), -- 分数
            completed_date DATE NOT NULL, -- 完成日期
            notes TEXT, -- 备注信息
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(student_id, exam_id, completed_date)
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建作业表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS homework (
            id UUID PRIMARY KEY,
            title VARCHAR(200) NOT NULL, -- 作业标题
            description TEXT, -- 作业描述
            due_date DATE, -- 截止日期
            grade INT NOT NULL, -- 适用年级
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建学生作业提交记录表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS student_homework_submissions (
            id UUID PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES student_info(id) ON DELETE CASCADE,
            homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
            file_path TEXT, -- 作业文件路径
            submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 提交日期
            score DECIMAL(5,2), -- 分数
            feedback TEXT, -- 教师反馈
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(student_id, homework_id)
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
        AND table_name IN (
            'users', 
            'student_info', 
            'course_records', 
            'student_course_records', 
            'exams', 
            'student_exam_records', 
            'homework', 
            'student_homework_submissions'
        )
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
