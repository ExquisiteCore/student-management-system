'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get, post } from "@/lib/http";
import { info } from "@/lib/log";
import { BookOpen, Plus, Search, ArrowLeft, Eye, Edit, Trash2, Calendar, Clock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PATHS } from "@/lib/path";

// 定义课程类型
type Course = {
  id: string;
  name: string;
  description: string;
  teacher_name: string;
  schedule: string;
  duration: number; // 单位：分钟
  student_count: number;
  status: string;
  keywords: string[];
  created_at: number[];
  updated_at: number[];
};

export default function CoursesPage() {
  // 课程列表状态
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    keywords: string[];
  }>({
    name: '',
    description: '',
    keywords: []
  });

  // 获取课程列表
  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await get<Course[]>('/course');
        setCourses(res);
        setError(null);
      } catch (err) {
        setError('获取课程列表失败');
        info('获取课程列表失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  // 过滤课程列表
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取课程状态标签样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // 获取课程状态中文名称
  const getStatusName = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'completed':
        return '已结束';
      case 'cancelled':
        return '已取消';
      default:
        return '未知状态';
    }
  };

  // 格式化课程时长
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    } else {
      return `${mins}分钟`;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await post('/courses', formData);
      setDialogOpen(false);
      setFormData({ name: '', description: '', keywords: [] });
      const res = await get<Course[]>('/courses');
      setCourses(res);
    } catch (err) {
      setError('创建课程失败');
      info('创建课程失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新课程</DialogTitle>
            <DialogDescription>
              填写课程信息并提交
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                课程名称
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                课程描述
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="keywords" className="text-right">
                关键词
              </Label>
              <Input
                id="keywords"
                value={formData.keywords.join(',')}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value.split(',') })}
                placeholder="用逗号分隔多个关键词"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href={PATHS.SITE_HOME}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">课程管理</h1>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={18} />
          <span>添加课程</span>
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索课程名称、教师或描述"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">全部状态</Button>
          </div>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              重试
            </Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">暂无课程</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? '没有找到匹配的课程，请尝试其他搜索词' : '目前没有任何课程，点击添加按钮创建新课程'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{course.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(course.status)}`}>
                    {getStatusName(course.status)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {course.keywords?.map((keyword, index) => (
                    <span key={index} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span>教师: {course.teacher_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>课程安排: {course.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-muted-foreground" />
                    <span>课程时长: {formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span>学生人数: {course.student_count}人</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}