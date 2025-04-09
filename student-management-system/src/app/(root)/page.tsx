'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, BookOpen, GraduationCap, ListChecks, PlusCircle, Users, User, LogIn } from "lucide-react";
import { SearchStudentDialog } from "@/components/search-student-dialog";
import { CreateAnnouncementDialog } from "@/components/create-announcement-dialog";
import { useState, useEffect } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { PATHS } from "@/lib/path";
import { AuthState } from "@/lib/types";
import { useRouter } from "next/navigation";
import { info } from "@/lib/log";
import { get } from "@/lib/http";

// 定义数据类型
type DataCounts = {
  students: number;
  homeworks: number;
  courses: number;
  exams: number;
};

// 定义用户类型
type UserData = {
  name: string;
  role: string;
  avatar: string;
} | null;

// 定义公告类型
type Announcement = {
  id: string;
  title: string;
  content: string;
  publisher_name: string;
  published_at: number[];
};

export default function Home() {
  const router = useRouter();

  // 用户状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData>(null);
  const [imageError, setImageError] = useState(false);

  // 公告状态
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 数据统计
  const [dataCounts, setDataCounts] = useState<DataCounts>({
    students: 0,
    homeworks: 0,
    courses: 0,
    exams: 0
  });

  // 获取各类数据
  useEffect(() => {
    // 获取公告
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        const res = await get<Announcement[]>('/announcements');
        setAnnouncements(res);
        setError(null);
      } catch (err) {
        setError('获取公告失败');
        info('获取公告失败:', err);
      } finally {
        setLoading(false);
      }
    }

    // 获取学生列表
    async function fetchData() {
      try {
        // 并行获取所有数据
        await fetchAnnouncements();
        const [students, homeworks, courses, exams] = await Promise.all([
          get<Array<Record<string, unknown>>>("/students").catch(error => {
            info('获取学生列表失败:', error);
            return [];
          }),
          get<Array<Record<string, unknown>>>("/homeworks").catch(error => {
            info('获取作业列表失败:', error);
            return [];
          }),
          get<Array<Record<string, unknown>>>("/courses").catch(error => {
            info('获取课程列表失败:', error);
            return [];
          }),
          get<Array<Record<string, unknown>>>("/exams").catch(error => {
            info('获取试卷列表失败:', error);
            return [];
          })
        ]);

        // 更新数据计数
        setDataCounts({
          students: students.length,
          homeworks: homeworks.length,
          courses: courses.length,
          exams: exams.length
        });
      } catch (error) {
        info('获取数据失败:', error);
      }
    }

    fetchData();
  }, []);

  // 检查用户登录状态
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const store = await Store.get("auth.dat");
        if (!store) {
          setIsLoggedIn(false);
          return;
        }

        const hasAuth = await store.has("auth");
        if (!hasAuth) {
          setIsLoggedIn(false);
          return;
        }

        const authData = await store.get("auth") as AuthState;
        if (authData && authData.token && authData.user) {
          setIsLoggedIn(true);
          setUser({
            name: authData.user.username,
            role: authData.user.role,
            avatar: authData.user.avatar_url || ""
          });
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        info('获取认证信息失败:', error);
        setIsLoggedIn(false);
      }
    }

    checkAuthStatus();
  }, []);

  // 处理登出
  const handleLogout = async () => {
    try {
      const store = await Store.get("auth.dat");
      if (store) {
        await store.delete("auth");
        await store.save();
      }
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      info('退出登录失败:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* 用户头像卡片或登录按钮 - 右上角 */}
      <div className="absolute top-4 right-4 z-10">
        {isLoggedIn && user ? (
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg shadow-sm border">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full ${imageError ? 'bg-primary/10 flex items-center justify-center text-primary' : 'bg-primary/10 overflow-hidden'}`}>
                {imageError || !user.avatar ? (
                  <User size={24} />
                ) : (
                  <Image
                    src={user.avatar}
                    alt={`${user.name}的头像`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium">
                {user.role === "teacher" ? "师" : "生"}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-card shadow-sm border"
            onClick={() => router.push(PATHS.AUTH_SIGN_IN)}
          >
            <LogIn size={18} />
            <span>登录</span>
          </Button>
        )}
      </div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">学生管理系统</h1>
        <p className="text-muted-foreground mt-1">欢迎使用学生管理系统，轻松管理学生信息</p>
      </div>

      {/* 快速操作区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <div className="flex flex-wrap gap-3">
            <SearchStudentDialog />
            <Button variant="outline" className="gap-2">
              <BarChart3 size={18} />
              成绩分析
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">系统公告</h2>
            {isLoggedIn && user && user.role === "teacher" && (
              <CreateAnnouncementDialog />
            )}
          </div>
          <div className="space-y-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-accent rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground">
                        发布者: {announcement.publisher_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                    >
                      {expandedId === announcement.id ? '收起' : '展开'}
                    </Button>
                  </div>
                  {expandedId === announcement.id && (
                    <div className="mt-2 p-2 bg-background rounded">
                      <p className="text-sm">{announcement.content}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium opacity-80">学生总数</p>
              <h3 className="text-3xl font-bold mt-2">{dataCounts.students}</h3>
            </div>
            <Users className="opacity-80" size={24} />
          </div>
        </div>

        <div className="bg-secondary text-secondary-foreground p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium opacity-80">作业数量</p>
              <h3 className="text-3xl font-bold mt-2">{dataCounts.homeworks}</h3>
            </div>
            <GraduationCap className="opacity-80" size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">课程数量</p>
              <h3 className="text-3xl font-bold mt-2">{dataCounts.courses}</h3>
            </div>
            <BookOpen className="text-muted-foreground" size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">试卷总数</p>
              <h3 className="text-3xl font-bold mt-2">{dataCounts.exams}</h3>
            </div>
            <ListChecks className="text-muted-foreground" size={24} />
          </div>
        </div>
      </div>

      {/* 功能导航区 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">功能导航</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <TooltipProvider>
            {[
              { title: "学生管理", icon: <Users size={24} />, color: "bg-blue-100 dark:bg-blue-950" },
              { title: "课程管理", icon: <BookOpen size={24} />, color: "bg-yellow-100 dark:bg-yellow-950" },
              { title: "试卷管理", icon: <ListChecks size={24} />, color: "bg-red-100 dark:bg-red-950" },
              { title: "作业管理", icon: <Users size={24} />, color: "bg-purple-100 dark:bg-purple-950" },
              { title: "成绩分析", icon: <BarChart3 size={24} />, color: "bg-pink-100 dark:bg-pink-950" },
              { title: "添加数据", icon: <PlusCircle size={24} />, color: "bg-orange-100 dark:bg-orange-950" },
            ].map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href="#"
                    className={`flex flex-col items-center justify-center p-6 rounded-lg ${item.color} hover:shadow-md transition-all`}
                  >
                    {item.icon}
                    <span className="mt-2 font-medium">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>进入{item.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">最近活动（未上线）</h2>
        <div className="space-y-4">
          {[
            { action: "添加了新学生", user: "管理员", time: "10分钟前" },
            { action: "更新了课程信息", user: "教务主任", time: "1小时前" },
            { action: "记录了班级考勤", user: "班主任", time: "3小时前" },
            { action: "上传了期中考试成绩", user: "教师", time: "昨天" },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.action}</p>
                <p className="text-sm text-muted-foreground">{item.user}</p>
              </div>
              <span className="text-sm text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
