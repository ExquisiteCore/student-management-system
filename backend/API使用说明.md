# 学生管理系统 API 使用说明

本文档提供学生管理系统 API 的详细使用说明，包括请求参数、响应格式以及示例。

## 基础信息

- 基础 URL: `/api`
- 所有请求和响应均使用 JSON 格式
- 认证方式: JWT 令牌（除公共 API 外，所有 API 都需要认证）

## 用户 API

### 用户注册

- **URL**: `/users/register`
- **方法**: POST
- **描述**: 创建新用户账号（包含学生信息）
- **权限**: 公共 API，无需认证

#### 请求参数

```json
{
  "username": "string",         // 用户名（必填）
  "email": "string",           // 电子邮件（必填）
  "password": "string",        // 密码（必填）
  "display_name": "string",    // 显示名称（可选）
  "avatar_url": "string",      // 头像URL（可选）
  "bio": "string",             // 个人简介（可选）
  "role": "string",            // 用户角色，默认为"student"（可选）
  "grade": number,             // 年级，仅学生用户（可选）
  "parent_name": "string",     // 家长姓名，仅学生用户（可选）
  "parent_phone": "string",    // 家长电话，仅学生用户（可选）
  "address": "string",         // 地址，仅学生用户（可选）
  "notes": "string"            // 备注，仅学生用户（可选）
}
```

#### 响应

成功响应 (200 OK):

```json
{
  "id": "uuid",                // 用户ID
  "username": "string",        // 用户名
  "email": "string",          // 电子邮件
  "display_name": "string",   // 显示名称
  "avatar_url": "string",     // 头像URL
  "bio": "string",            // 个人简介
  "role": "string",           // 用户角色
  "grade": number,            // 年级（仅学生用户）
  "parent_name": "string",    // 家长姓名（仅学生用户）
  "parent_phone": "string",   // 家长电话（仅学生用户）
  "address": "string",        // 地址（仅学生用户）
  "notes": "string",          // 备注（仅学生用户）
  "created_at": "string",     // 创建时间
  "updated_at": "string"      // 更新时间
}
```

错误响应:

- 400 Bad Request: 请求参数无效
- 409 Conflict: 用户名或邮箱已存在
- 500 Internal Server Error: 服务器内部错误

### 用户登录

- **URL**: `/users/login`
- **方法**: POST
- **描述**: 验证用户凭据并生成 JWT 令牌
- **权限**: 公共 API，无需认证

#### 请求参数

```json
{
  "username_or_email": "string", // 用户名或电子邮件（必填）
  "password": "string" // 密码（必填）
}
```

#### 响应

成功响应 (200 OK):

```json
{
  "user": {                     // 用户信息
    "id": "uuid",              // 用户ID
    "username": "string",      // 用户名
    "email": "string",        // 电子邮件
    "display_name": "string", // 显示名称
    "avatar_url": "string",   // 头像URL
    "bio": "string",          // 个人简介
    "role": "string",         // 用户角色
    "grade": number,          // 年级（仅学生用户）
    "parent_name": "string",  // 家长姓名（仅学生用户）
    "parent_phone": "string", // 家长电话（仅学生用户）
    "address": "string",      // 地址（仅学生用户）
    "notes": "string",        // 备注（仅学生用户）
    "created_at": "string",   // 创建时间
    "updated_at": "string"    // 更新时间
  },
  "token": "string"            // JWT令牌
}
```

错误响应:

- 400 Bad Request: 请求参数无效
- 401 Unauthorized: 用户名/邮箱或密码错误
- 500 Internal Server Error: 服务器内部错误

## 认证与授权

除了公共 API 外，所有 API 都需要在请求头中包含 JWT 令牌进行认证：

```
Authorization: Bearer <token>
```

其中`<token>`是通过登录 API 获取的 JWT 令牌。

### 令牌刷新

- **URL**: `/auth/refresh`
- **方法**: POST
- **描述**: 刷新 JWT 令牌
- **权限**: 公共 API，但需要有效的刷新令牌

## 使用示例

### 注册新用户

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student123",
    "email": "student@example.com",
    "password": "password123",
    "display_name": "张三",
    "role": "student",
    "grade": 1,
    "parent_name": "张父",
    "parent_phone": "13800138000"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "student123",
    "password": "password123"
  }'
```

### 使用令牌访问受保护的 API

```bash
curl -X GET http://localhost:8080/api/students \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 错误处理

所有 API 错误响应都遵循以下格式：

```json
{
  "error": {
    "message": "错误描述",
    "type": "错误类型"
  }
}
```

常见错误类型：

- `BadRequest`: 请求参数无效
- `Unauthorized`: 未认证或认证失败
- `Forbidden`: 权限不足
- `NotFound`: 资源不存在
- `Duplicate`: 资源已存在（如用户名或邮箱）
- `IncorrectLogin`: 登录凭据错误
- `Internal`: 服务器内部错误
- `Db`: 数据库错误

## 注意事项

1. 所有密码在传输和存储时都经过加密处理
2. 用户角色目前支持两种：`teacher`（教师）和`student`（学生）
3. 学生用户可以包含额外的学生信息字段（年级、家长信息等）
4. API 响应中的时间戳采用 ISO 8601 格式
