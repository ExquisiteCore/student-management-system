'use client';

import { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { get } from '@/lib/http';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UUID } from 'crypto';
import { info } from '@/lib/log';

// API返回的学生数据结构
interface StudentApiResponse {
  id: UUID;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
  updated_at: string;
  grade?: number;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  notes?: string;
}

// 单个学生详情API响应
interface StudentDetailApiResponse {
  // 学生关联的课程记录
  course_records: Array<{
    id: UUID;
    student_id: UUID;
    course_id: UUID;
    class_date: string;
    content: string;
    performance?: string;
    teacher_id: UUID;
    created_at: string;
    updated_at: string;
  }>;

  // 学生关联的作业
  homeworks: Array<{
    id: UUID;
    student_id: UUID;
    title: string;
    description?: string;
    file_path?: string;
    submission_date: string;
    grade?: string;
    feedback?: string;
    teacher_id?: UUID;
    created_at: string;
    updated_at: string;
  }>;

  // 学生关联的考试记录
  exam_records: Array<{
    id: UUID;
    student_id: UUID;
    exam_id: UUID;
    score?: number;
    completion_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;

  // 学生基本信息
  user: StudentApiResponse;
}

// 组件内部使用的学生数据结构
type Student = {
  id: string;
  name: string;       // 对应用户表的display_name或username
  class_name?: string; // 对应用户表的grade字段转换
  student_id?: string; // 对应用户表的username
  avatar_url?: string; // 学生头像
  // 其他可能需要的字段
  grade?: number;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  notes?: string;
  email?: string;
  bio?: string;
  // 关联数据
  course_records?: Array<{
    id: UUID;
    student_id: UUID;
    course_id: UUID;
    class_date: string;
    content: string;
    performance?: string;
    teacher_id: UUID;
    created_at: string;
    updated_at: string;
  }>;
  homeworks?: Array<{
    id: UUID;
    student_id: UUID;
    title: string;
    description?: string;
    file_path?: string;
    submission_date: string;
    grade?: string;
    feedback?: string;
    teacher_id?: UUID;
    created_at: string;
    updated_at: string;
  }>;
  exam_records?: Array<{
    id: UUID;
    student_id: UUID;
    exam_id: UUID;
    score?: number;
    completion_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;
};

export function SearchStudentDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 加载所有学生数据
  useEffect(() => {
    if (open) {
      fetchAllStudents();
    } else {
      // 关闭对话框时重置选中的学生
      setSelectedStudent(null);
    }
  }, [open]);

  // 本地搜索功能
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(allStudents);
    } else {
      const filtered = allStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.student_id && student.student_id.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
    }
  }, [searchQuery, allStudents]);

  // 获取所有学生
  const fetchAllStudents = async () => {
    setIsSearching(true);
    try {
      const data = await get<StudentApiResponse[]>(`/students`);

      // 将API返回的用户数据转换为Student类型
      const students: Student[] = data.map((user) => ({
        id: user.id,
        name: user.display_name || user.username,
        class_name: user.grade ? `${user.grade}年级` : '-',
        student_id: user.username,
        avatar_url: user.avatar_url,
        grade: user.grade,
        parent_name: user.parent_name,
        parent_phone: user.parent_phone,
        address: user.address,
        notes: user.notes,
        email: user.email,
        bio: user.bio
      }));

      setAllStudents(students);
      setSearchResults(students);
    } catch (error) {
      console.error('获取学生列表失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 获取学生详情
  const fetchStudentDetails = async (studentId: string) => {
    setIsLoadingDetails(true);
    try {
      const data = await get<StudentDetailApiResponse>(`/students/${studentId}`);

      // 转换为Student类型
      const studentDetails: Student = {
        id: data.user.id,
        name: data.user.display_name || data.user.username,
        class_name: data.user.grade ? `${data.user.grade}年级` : '-',
        student_id: data.user.username,
        avatar_url: data.user.avatar_url,
        grade: data.user.grade,
        parent_name: data.user.parent_name,
        parent_phone: data.user.parent_phone,
        address: data.user.address,
        notes: data.user.notes,
        email: data.user.email,
        bio: data.user.bio,
        // 添加关联数据
        course_records: data.course_records,
        homeworks: data.homeworks,
        exam_records: data.exam_records
      };
      info('返回:', data);
      info('获取学生id:', studentId);
      info('SearchStudentDialog', studentDetails)

      setSelectedStudent(studentDetails);
    } catch (error) {
      console.error('获取学生详情失败:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search size={18} />
          查找学生
        </Button>
      </DialogTrigger>
      <DialogContent className={selectedStudent ? "sm:max-w-2xl" : "sm:max-w-md"}>
        {!selectedStudent ? (
          <>
            <DialogHeader>
              <DialogTitle>查找学生</DialogTitle>
              <DialogDescription>
                输入学生姓名或学号进行搜索
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center space-x-2 py-4">
              <div className="grid flex-1 gap-2">
                <Input
                  placeholder="请输入学生姓名或学号"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            {isSearching ? (
              <div className="py-8 text-center text-muted-foreground">
                正在加载学生数据...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <div className="p-2 bg-muted text-xs font-medium grid grid-cols-4">
                  <div className="col-span-1">头像</div>
                  <div className="col-span-1">姓名</div>
                  <div className="col-span-1">班级</div>
                  <div className="col-span-1">学号</div>
                </div>
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="p-2 text-sm grid grid-cols-4 hover:bg-accent cursor-pointer border-t items-center"
                    onClick={() => fetchStudentDetails(student.id)}
                  >
                    <div className="col-span-1">
                      <Avatar className="size-8">
                        <AvatarImage src={student.avatar_url} alt={student.name} />
                        <AvatarFallback>{student.name?.[0]?.toUpperCase() || <User size={16} />}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="col-span-1">{student.name}</div>
                    <div className="col-span-1">{student.class_name || '-'}</div>
                    <div className="col-span-1">{student.student_id || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? '未找到匹配的学生' : '暂无学生数据'}
              </div>
            )}

            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                关闭
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>学生详情</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedStudent(null)}
                >
                  <X size={18} />
                </Button>
              </div>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="py-8 text-center text-muted-foreground">
                正在加载学生详情...
              </div>
            ) : (
              <div className="py-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="size-24 mb-2">
                      <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                      <AvatarFallback className="text-lg">
                        {selectedStudent.name?.[0]?.toUpperCase() || <User size={24} />}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-medium">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.student_id}</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">基本信息</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">班级</span>
                          <span className="text-sm col-span-2">{selectedStudent.class_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">邮箱</span>
                          <span className="text-sm col-span-2">{selectedStudent.email || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">简介</span>
                          <span className="text-sm col-span-2">{selectedStudent.bio || '-'}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">家长信息</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">家长姓名</span>
                          <span className="text-sm col-span-2">{selectedStudent.parent_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">联系电话</span>
                          <span className="text-sm col-span-2">{selectedStudent.parent_phone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">家庭住址</span>
                          <span className="text-sm col-span-2">{selectedStudent.address || '-'}</span>
                        </div>
                      </div>
                    </Card>

                    {selectedStudent.notes && (
                      <Card className="p-4 col-span-1 sm:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">备注</h4>
                        <p className="text-sm">{selectedStudent.notes}</p>
                      </Card>
                    )}

                    {/* 课程记录 */}
                    {selectedStudent.course_records && selectedStudent.course_records.length > 0 && (
                      <Card className="p-4 col-span-1 sm:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">课程记录</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          <div className="text-xs grid grid-cols-3 font-medium mb-2">
                            <div>日期</div>
                            <div>内容</div>
                            <div>表现</div>
                          </div>
                          {selectedStudent.course_records.map((record) => (
                            <div key={record.id.toString()} className="text-sm grid grid-cols-3 border-t py-2">
                              <div>{new Date(record.class_date).toLocaleDateString()}</div>
                              <div>{record.content}</div>
                              <div>{record.performance || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* 作业 */}
                    {selectedStudent.homeworks && selectedStudent.homeworks.length > 0 && (
                      <Card className="p-4 col-span-1 sm:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">作业</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          <div className="text-xs grid grid-cols-4 font-medium mb-2">
                            <div>日期</div>
                            <div>标题</div>
                            <div>评分</div>
                            <div>反馈</div>
                          </div>
                          {selectedStudent.homeworks.map((homework) => (
                            <div key={homework.id.toString()} className="text-sm grid grid-cols-4 border-t py-2">
                              <div>{new Date(homework.submission_date).toLocaleDateString()}</div>
                              <div>{homework.title}</div>
                              <div>{homework.grade || '-'}</div>
                              <div>{homework.feedback || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* 考试记录 */}
                    {selectedStudent.exam_records && selectedStudent.exam_records.length > 0 && (
                      <Card className="p-4 col-span-1 sm:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">考试记录</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          <div className="text-xs grid grid-cols-3 font-medium mb-2">
                            <div>日期</div>
                            <div>分数</div>
                            <div>备注</div>
                          </div>
                          {selectedStudent.exam_records.map((record) => (
                            <div key={record.id.toString()} className="text-sm grid grid-cols-3 border-t py-2">
                              <div>{new Date(record.completion_date).toLocaleDateString()}</div>
                              <div>{record.score !== undefined && record.score !== null ? record.score : '-'}</div>
                              <div>{record.notes || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedStudent(null)}
              >
                返回列表
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}