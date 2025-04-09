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
    } catch (err) {
      setError('获取课程记录失败');
      info('获取课程记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
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
                  <TableHead>学生ID</TableHead>
                  <TableHead>教师ID</TableHead>
                  <TableHead>课程内容</TableHead>
                  <TableHead>表现评价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.class_date)}</TableCell>
                    <TableCell>{record.student_id.substring(0, 8)}</TableCell>
                    <TableCell>{record.teacher_id.substring(0, 8)}</TableCell>
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