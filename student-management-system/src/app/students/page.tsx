'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get } from "@/lib/http";
import { info } from "@/lib/log";
import { Users, Plus, Search, ArrowLeft, Eye, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PATHS } from "@/lib/path";
import Image from "next/image";

// 定义学生类型
type Student = {
  id: string;
  user_id: string;
  name: string;
  grade: number;
  parent_name: string;
  parent_phone: string;
  address: string;
  notes?: string;
  avatar_url?: string;
  created_at?: number[];
};

export default function StudentsPage() {
  // 学生列表状态
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  // 获取学生列表
  useEffect(() => {
    async function fetchStudents() {
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
    }

    fetchStudents();
  }, []);

  // 过滤学生列表
  const filteredStudents = students.filter(student =>
    (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
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

  return (
    <div className="container mx-auto px-4 py-8">
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
        <Button className="gap-2">
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
                                alt={`${student.name}的头像`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(student.id)}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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