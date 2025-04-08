//! API路由模块
//!
//! 包含所有API端点的路由定义
mod activityapi;
mod courseapi;
mod examapi;
mod homeworkapi;
mod studentapi;
mod userapi;

use axum::{
    Router,
    middleware::from_fn,
    routing::{delete, get, post, put},
};

use sqlx::{Pool, Postgres};
use std::sync::Arc;

use crate::middleware::auth;

/// 创建API路由
pub fn create_routes() -> Router<Arc<Pool<Postgres>>> {
    // 公共路由 - 不需要认证
    let public_routes = Router::new()
        .route("/users/register", post(userapi::register_user))
        .route("/users/login", post(userapi::login_user))
        .route("/auth/refresh", post(auth::refresh_token_handler))
        .route("/students", get(studentapi::get_all_students))
        .route("homeworks", get(homeworkapi::get_all_homework))
        .route("courses", get(courseapi::get_all_course_records))
        .route("exams", get(examapi::get_all_exam_records));

    // 学生相关路由 - 需要用户认证
    let student_routes = Router::new()
        .route("/students", post(studentapi::create_student))
        .route("/students/{id}", get(studentapi::get_student))
        .route("/students/{id}", put(studentapi::update_student))
        .route("/students/{id}", delete(studentapi::delete_student))
        .route(
            "/students/grade/{grade}",
            get(studentapi::get_students_by_grade),
        )
        .layer(from_fn(auth::auth_middleware));

    // 课程相关路由 - 需要用户认证
    let course_routes = Router::new()
        .route("/courses", post(courseapi::create_course))
        .route("/courses/{id}", get(courseapi::get_course))
        .route("/courses/{id}", put(courseapi::update_course))
        .route("/courses/{id}", delete(courseapi::delete_course))
        .route(
            "/courses/search/{keyword}",
            get(courseapi::search_courses_by_keyword),
        )
        .route("/course-records", post(courseapi::create_course_record))
        .route("/course-records/{id}", get(courseapi::get_course_record))
        .route("/course-records/{id}", put(courseapi::update_course_record))
        .route(
            "/course-records/{id}",
            delete(courseapi::delete_course_record),
        )
        .route(
            "/course-records/query",
            get(courseapi::query_course_records),
        )
        .layer(from_fn(auth::auth_middleware));

    // 试卷相关路由 - 需要用户认证
    let exam_routes = Router::new()
        .route("/exams", post(examapi::create_exam))
        .route("/exams/{id}", get(examapi::get_exam))
        .route("/exams/{id}", put(examapi::update_exam))
        .route("/exams/{id}", delete(examapi::delete_exam))
        .route(
            "/exams/search/{keyword}",
            get(examapi::search_exams_by_keyword),
        )
        .route("/exam-records", post(examapi::create_exam_record))
        .route("/exam-records/{id}", get(examapi::get_exam_record))
        .route("/exam-records/{id}", put(examapi::update_exam_record))
        .route("/exam-records/{id}", delete(examapi::delete_exam_record))
        .route("/exam-records/query", get(examapi::query_exam_records))
        .layer(from_fn(auth::auth_middleware));

    // 作业相关路由 - 需要用户认证
    let homework_routes = Router::new()
        .route("/homework", post(homeworkapi::create_homework))
        .route("/homework/{id}", get(homeworkapi::get_homework))
        .route("/homework/{id}", put(homeworkapi::update_homework))
        .route("/homework/{id}", delete(homeworkapi::delete_homework))
        .route("/homework/query", get(homeworkapi::query_homework))
        .route("/homework/{id}/grade", put(homeworkapi::grade_homework))
        .layer(from_fn(auth::auth_middleware));

    // 活动记录相关路由 - 需要用户认证
    let activity_routes = Router::new()
        .route("/activities", get(activityapi::get_activities))
        .route("/activities", post(activityapi::create_activity));

    // 管理员路由 - 需要管理员权限
    let admin_routes = Router::new().layer(from_fn(auth::admin_middleware));

    // 合并所有路由
    Router::new()
        .merge(student_routes)
        .merge(course_routes)
        .merge(exam_routes)
        .merge(homework_routes)
        .merge(activity_routes)
        .merge(admin_routes)
        .merge(public_routes)
}
