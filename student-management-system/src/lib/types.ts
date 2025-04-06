// 定义API响应的类型接口

import { UUID } from "crypto";

// 用户信息接口
export interface User {
  avatar_url: string;
  email: string;
  id: UUID;
  username: string;
  role: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
}

// 认证状态接口，用于localStorage存储
export interface AuthState {
  token: string;
  user: User;
}
