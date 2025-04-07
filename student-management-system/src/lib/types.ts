// 定义API响应的类型接口

import { UUID } from "crypto";

// 用户信息接口
export interface User {
  avatar_url: string;
  email: string;
  id: UUID;
  username: string;
  role: string;
  bio?: string | null;
  display_name?: string | null;
  created_at?: number[];
  updated_at?: number[];
}

// 学生信息接口
export interface Student {
  id: UUID;
  user_id: UUID;
  grade: number;
  parent_name: string;
  parent_phone: string;
  address: string;
  notes?: string;
  created_at?: number[];
  updated_at?: number[];
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
  student?: Student;
}

// 认证状态接口，用于localStorage存储
export interface AuthState {
  token: string;
  user: User;
  student?: Student;
}
