'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get, del } from "@/lib/http";
import { info } from "@/lib/log";
import { Users, Plus, Search, ArrowLeft, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PATHS } from "@/lib/path";
import Image from "next/image";
import { UUID } from "crypto";
import { StudentDetailDialog } from "@/components/student-detail-dialog";
import { AddStudentDialog } from "@/components/add-student-dialog";

// 定义学生类型
type Student = {
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
};

export default function StudentsPage() {
  // 学生列表状态
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  // 获取学生列表
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

  useEffect(() => {
    fetchStudents();
  }, []);

  // 过滤学生列表
  const filteredStudents = students.filter(student =>
    (student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (student.parent_phone?.includes(searchTerm) ?? false)
  );

  // 处理图片加载错误
  const handleImageError = (studentId: string) => {
    setImageError(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <StudentDetailDialog
        studentId={selectedStudentId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          // 刷新学生列表
          fetchStudents();
        }}
      />
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href={PATHS.SITE_HOME}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">学生管理</h1>
        </div>
        <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
          <Plus size={18} />
          <span>添加学生</span>
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索学生姓名、家长姓名或联系电话"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">全部年级</Button>
          </div>
        </div>
      </div>

      {/* 学生列表 */}
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
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">暂无学生</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? '没有找到匹配的学生，请尝试其他搜索词' : '目前没有任何学生，点击添加按钮创建新学生'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">学生信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">年级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">家长信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">地址</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full ${imageError[student.id] || !student.avatar_url ? 'bg-primary/10 flex items-center justify-center text-primary' : 'bg-primary/10 overflow-hidden'}`}>
                            {imageError[student.id] || !student.avatar_url ? (
                              <Users size={20} />
                            ) : (
                              <Image
                                src={student.avatar_url}
                                alt={`${student.username}的头像`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(student.id)}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">姓名：{student.username}</p>
                          <p className="text-xs text-muted-foreground">ID: {student.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {student.grade}年级
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{student.parent_name}</p>
                      <p className="text-xs text-muted-foreground">{student.parent_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm truncate max-w-[200px]">{student.address}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (confirm(`确定要删除学生 ${student.username} 吗？`)) {
                              try {
                                await del(`/delstudent/${student.id}`);
                                setStudents(students.filter(s => s.id !== student.id));
                              } catch (err) {
                                info('删除学生失败:', err);
                                alert('删除学生失败');
                              }
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}