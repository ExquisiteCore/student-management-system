'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { get } from '@/lib/http';
import { info } from '@/lib/log';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CourseRecord = {
  id: string;
  student_id: string;
  course_id: string;
  class_date: string;
  content: string;
  performance: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
};

export function CourseRecordsDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [records, setRecords] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && courseId) {
      fetchRecords();
    }
  }, [open, courseId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await get<CourseRecord[]>('/course-records/query', {
        params: { course_id: courseId },
      });
      setRecords(res);
      setError(null);

      // 获取用户名映射
      const newNameMap: Record<string, string> = {};
      await Promise.all(
        res.map(async (record) => {
          try {
            const studentName = await get<string>(`/username/${record.student_id}`);
            newNameMap[record.student_id] = studentName;
            const teacherName = await get<string>(`/username/${record.teacher_id}`);
            newNameMap[record.teacher_id] = teacherName;
          } catch (err) {
            info('获取用户名失败:', err);
          }
        })
      );
      setNameMap(newNameMap);
    } catch (err) {
      setError('获取课程记录失败');
      info('获取课程记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (Array.isArray(dateStr)) {
      const [year, dayOfYear] = dateStr;
      const date = new Date(year, 0); // 从年份的第一天开始
      date.setDate(dayOfYear); // 加上天数
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>课程记录</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-destructive">
            <p>{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            暂无课程记录
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>上课日期</TableHead>
                  <TableHead>学生名称</TableHead>
                  <TableHead>教师名称</TableHead>
                  <TableHead>课程内容</TableHead>
                  <TableHead>表现评价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.class_date)}</TableCell>
                    <TableCell>{nameMap[record.student_id] || record.student_id.substring(0, 8)}</TableCell>
                    <TableCell>{nameMap[record.teacher_id] || record.teacher_id.substring(0, 8)}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.content}</TableCell>
                    <TableCell>{record.performance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}