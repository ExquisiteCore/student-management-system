import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get } from "@/lib/http";
import { info } from "@/lib/log";
import { Users, BookOpen, FileText, ClipboardList } from "lucide-react";
import Image from "next/image";

type StudentDetail = {
  user: {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    role: string;
    grade?: number;
    parent_name?: string;
    parent_phone?: string;
    address?: string;
    notes?: string | null;
    created_at: number[];
    updated_at: number[];
  };
  course_records: {
    id: string;
    student_id: string;
    course_id: string;
    class_date: string;
    content: string;
    performance?: string;
    teacher_id: string;
    created_at: string;
    updated_at: string;
  }[];
  homeworks: {
    id: string;
    student_id: string;
    title: string;
    description?: string;
    file_path?: string;
    submission_date: string;
    grade?: string;
    feedback?: string;
    teacher_id?: string;
    created_at: string;
    updated_at: string;
  }[];
  exam_records: {
    id: string;
    student_id: string;
    exam_id: string;
    score?: number;
    completion_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }[];
};

export function StudentDetailDialog({
  studentId,
  open,
  onOpenChange,
}: {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const res = await get<StudentDetail>(`/students/${studentId}`);
      setStudentDetail(res);
      setError(null);
    } catch (err) {
      setError('获取学生详情失败');
      info('获取学生详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetail();
    }
  }, [open, studentId]);

  const formatDate = (dateArray: number[]) => {
    if (!dateArray || dateArray.length < 6) return '';
    const [year, month, day, hour, minute] = dateArray;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学生详情</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchStudentDetail}>
              重试
            </Button>
          </div>
        ) : studentDetail ? (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="courses">课程记录</TabsTrigger>
              <TabsTrigger value="homeworks">作业情况</TabsTrigger>
              <TabsTrigger value="exams">考试成绩</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {studentDetail.user.avatar_url ? (
                      <Image
                        src={studentDetail.user.avatar_url}
                        alt={`${studentDetail.user.username}的头像`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={32} className="text-primary" />
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{studentDetail.user.username}</h3>
                    <p className="text-sm text-muted-foreground">{studentDetail.user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">年级: </span>
                      <span>{studentDetail.user.grade || '未设置'}年级</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">角色: </span>
                      <span>{studentDetail.user.role}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">家长: </span>
                      <span>{studentDetail.user.parent_name || '未设置'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">电话: </span>
                      <span>{studentDetail.user.parent_phone || '未设置'}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">创建时间: </span>
                      <span>{formatDate(studentDetail.user.created_at)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">更新时间: </span>
                      <span>{formatDate(studentDetail.user.updated_at)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">地址</h4>
                <p className="text-sm">{studentDetail.user.address || '未设置'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">备注</h4>
                <p className="text-sm">{studentDetail.user.notes || '无备注'}</p>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              {studentDetail.course_records.length > 0 ? (
                <div className="space-y-4">
                  {studentDetail.course_records.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.content}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.class_date).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-muted-foreground" />
                        </div>
                      </div>

                      {record.performance && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">上课表现</h5>
                          <p className="text-sm">{record.performance}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">暂无课程记录</h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="homeworks" className="space-y-4">
              {studentDetail.homeworks.length > 0 ? (
                <div className="space-y-4">
                  {studentDetail.homeworks.map((homework) => (
                    <div key={homework.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{homework.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(homework.submission_date).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                        </div>
                      </div>

                      {homework.description && (
                        <p className="mt-2 text-sm">{homework.description}</p>
                      )}

                      {homework.grade && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">成绩: {homework.grade}</h5>
                          {homework.feedback && (
                            <p className="text-sm">反馈: {homework.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">暂无作业记录</h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="exams" className="space-y-4">
              {studentDetail.exam_records.length > 0 ? (
                <div className="space-y-4">
                  {studentDetail.exam_records.map((exam) => (
                    <div key={exam.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">考试ID: {exam.exam_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(exam.completion_date).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClipboardList size={16} className="text-muted-foreground" />
                          {exam.score && (
                            <span className="font-medium">{exam.score}分</span>
                          )}
                        </div>
                      </div>

                      {exam.notes && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">备注</h5>
                          <p className="text-sm">{exam.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">暂无考试记录</h3>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}