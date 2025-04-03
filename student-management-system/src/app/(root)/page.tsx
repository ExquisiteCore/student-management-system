'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { BarChart3, BookOpen, GraduationCap, ListChecks, PlusCircle, Search, UserPlus, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
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
            <Button className="gap-2">
              <UserPlus size={18} />
              添加学生
            </Button>
            <Button variant="outline" className="gap-2">
              <Search size={18} />
              查找学生
            </Button>
            <Button variant="secondary" className="gap-2">
              <ListChecks size={18} />
              考勤管理
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 size={18} />
              成绩分析
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">系统公告</h2>
          <div className="space-y-2">
            <div className="p-3 bg-accent rounded-md">
              <p className="font-medium">期末考试安排已发布</p>
              <p className="text-sm text-muted-foreground">2023-06-15</p>
            </div>
            <div className="p-3 bg-accent rounded-md">
              <p className="font-medium">新学期注册开始</p>
              <p className="text-sm text-muted-foreground">2023-06-10</p>
            </div>
          </div>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium opacity-80">学生总数</p>
              <h3 className="text-3xl font-bold mt-2">256</h3>
            </div>
            <Users className="opacity-80" size={24} />
          </div>
        </div>

        <div className="bg-secondary text-secondary-foreground p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium opacity-80">班级数量</p>
              <h3 className="text-3xl font-bold mt-2">12</h3>
            </div>
            <GraduationCap className="opacity-80" size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">课程数量</p>
              <h3 className="text-3xl font-bold mt-2">36</h3>
            </div>
            <BookOpen className="text-muted-foreground" size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">今日出勤率</p>
              <h3 className="text-3xl font-bold mt-2">98%</h3>
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
              { title: "班级管理", icon: <GraduationCap size={24} />, color: "bg-green-100 dark:bg-green-950" },
              { title: "课程管理", icon: <BookOpen size={24} />, color: "bg-yellow-100 dark:bg-yellow-950" },
              { title: "考勤管理", icon: <ListChecks size={24} />, color: "bg-purple-100 dark:bg-purple-950" },
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
        <h2 className="text-xl font-semibold mb-4">最近活动</h2>
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
