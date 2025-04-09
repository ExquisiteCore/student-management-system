'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get, post, del, put } from "@/lib/http";
import { info } from "@/lib/log";
import { BookOpen, Plus, Search, ArrowLeft, Eye, Edit, Trash2 } from "lucide-react";
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [courseRecord, setCourseRecord] = useState<{
    id: string;
    student_id: string;
    course_id: string;
    class_date: string;
    content: string;
    performance: string;
    teacher_id: string;
    created_at: string;
    updated_at: string;
  } | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    keywords: string[];
  }>({
    name: '',
    description: '',
    keywords: []
  });

  // 删除课程
  const handleDeleteCourse = async (id: string) => {
    try {
      setLoading(true);
      await del(`/courses/${id}`);
      setCourses(courses.filter(course => course.id !== id));
      setError(null);
    } catch (err) {
      setError('删除课程失败');
      info('删除课程失败:', err);
    } finally {
      setLoading(false);
    }
  };

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


  const handleSubmit = async () => {
    try {
      setLoading(true);
      const isEditing = !!formData.name;

      if (isEditing) {
        const courseId = courses.find(c => c.name === formData.name)?.id;
        if (courseId) {
          await put(`/courses/${courseId}`, formData);
        }
      } else {
        await post('/courses', formData);
      }

      setDialogOpen(false);
      setFormData({ name: '', description: '', keywords: [] });
      const res = await get<Course[]>('/courses');
      setCourses(res);
    } catch (err) {
      setError(formData.name ? '更新课程失败' : '创建课程失败');
      info(formData.name ? '更新课程失败:' : '创建课程失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.name ? `编辑 ${formData.name}` : '添加新课程'}</DialogTitle>
            <DialogDescription>
              {formData.name ? '修改课程信息' : '填写课程信息并提交'}
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

      {/* 课程记录详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>课程记录详情</DialogTitle>
            <DialogDescription>
              查看课程记录详细信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {courseRecord && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">上课日期</Label>
                  <div className="col-span-3">{courseRecord.class_date}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">课程内容</Label>
                  <div className="col-span-3">{courseRecord.content}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">学生表现</Label>
                  <div className="col-span-3">{courseRecord.performance}</div>
                </div>
              </>
            )}
          </div>
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
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await get(`/course-records/${course.id}`);
                        setCourseRecord(res as {
                          id: string;
                          student_id: string;
                          course_id: string;
                          class_date: string;
                          content: string;
                          performance: string;
                          teacher_id: string;
                          created_at: string;
                          updated_at: string;
                        });
                        setDetailDialogOpen(true);
                      } catch (err) {
                        setError('获取课程记录失败');
                        info('获取课程记录失败:', err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setFormData({
                        name: course.name,
                        description: course.description,
                        keywords: course.keywords || []
                      });
                      setDialogOpen(true);
                    }}
                    disabled={loading}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={loading}
                  >
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