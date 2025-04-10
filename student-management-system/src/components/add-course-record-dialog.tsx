'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { get, post } from '@/lib/http';
import { info } from '@/lib/log';
import { Store } from "@tauri-apps/plugin-store";
import { AuthState } from "@/lib/types";

type Student = {
  id: string;
  username: string;
  email?: string;
  grade?: number;
};

type CourseRecordFormData = {
  student_id: string;
  course_id: string;
  class_date: string;
  content: string;
  performance: string;
  teacher_id: string;
};

export function AddCourseRecordDialog({
  courseId,
  open,
  onOpenChange,
  onSuccess,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseRecordFormData>({
    student_id: '',
    course_id: courseId,
    class_date: new Date().toISOString().split('T')[0],
    content: '',
    performance: '',
    teacher_id: '',
  });

  // 获取学生列表
  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchTeacherId();
      setFormData(prev => ({
        ...prev,
        course_id: courseId,
      }));
    }
  }, [open, courseId]);

  // 获取当前登录的教师ID
  const fetchTeacherId = async () => {
    try {
      const store = await Store.get("auth.dat");
      if (!store) return;

      const hasAuth = await store.has("auth");
      if (!hasAuth) return;

      const authData = await store.get("auth") as AuthState;
      if (authData && authData.token && authData.user && authData.user.role === 'teacher') {
        setFormData(prev => ({
          ...prev,
          teacher_id: authData.user.id,
        }));
      }
    } catch (error) {
      info('获取教师ID失败:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await get<Student[]>('/students');
      setStudents(res);
      setError(null);
    } catch (err) {
      setError('获取学生列表失败');
      info('获取学生列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.student_id) {
        setError('请选择学生');
        return;
      }
      if (!formData.class_date) {
        setError('请选择上课日期');
        return;
      }
      if (!formData.content) {
        setError('请填写课程内容');
        return;
      }

      setLoading(true);
      await post('/course-records', formData);
      setError(null);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      // 重置表单
      setFormData({
        student_id: '',
        course_id: courseId,
        class_date: new Date().toISOString().split('T')[0],
        content: '',
        performance: '',
        teacher_id: formData.teacher_id,
      });
    } catch (err) {
      setError('添加课程记录失败');
      info('添加课程记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加课程记录</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="student" className="text-right">
              选择学生
            </Label>
            <select
              id="student"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              disabled={loading}
            >
              <option value="">请选择学生</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.username} {student.grade ? `(${student.grade}年级)` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="class_date" className="text-right">
              上课日期
            </Label>
            <Input
              id="class_date"
              type="date"
              value={formData.class_date}
              onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content" className="text-right">
              课程内容
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="performance" className="text-right">
              表现评价
            </Label>
            <Textarea
              id="performance"
              value={formData.performance}
              onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '提交中...' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}