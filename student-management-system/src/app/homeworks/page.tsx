'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { get } from "@/lib/http";
import { info } from "@/lib/log";
import { GraduationCap, Plus, Search, ArrowLeft, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PATHS } from "@/lib/path";

// 定义作业类型
type Homework = {
  id: string;
  title: string;
  course_name: string;
  description: string;
  due_date: string;
  total_score: number;
  status: string;
};

export default function HomeworksPage() {
  // 作业列表状态
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 获取作业列表
  useEffect(() => {
    async function fetchHomeworks() {
      try {
        setLoading(true);
        const res = await get<Homework[]>('/homeworks');
        setHomeworks(res);
        setError(null);
      } catch (err) {
        setError('获取作业列表失败');
        info('获取作业列表失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeworks();
  }, []);

  // 过滤作业列表
  const filteredHomeworks = homeworks.filter(homework =>
    homework.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    homework.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取作业状态标签样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'graded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // 获取作业状态中文名称
  const getStatusName = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'pending':
        return '待提交';
      case 'overdue':
        return '已逾期';
      case 'graded':
        return '已批改';
      default:
        return '未知状态';
    }
  };

  // 格式化截止日期
  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算剩余时间
  const getRemainingTime = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();

    if (diffTime <= 0) {
      return '已截止';
    }

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `剩余 ${diffDays} 天 ${diffHours} 小时`;
    } else {
      return `剩余 ${diffHours} 小时`;
    }
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
          <h1 className="text-2xl font-bold">作业管理</h1>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          <span>添加作业</span>
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索作业标题或课程名称"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">全部状态</Button>
            <Button variant="outline">全部课程</Button>
          </div>
        </div>
      </div>

      {/* 作业列表 */}
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
        ) : filteredHomeworks.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">暂无作业</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? '没有找到匹配的作业，请尝试其他搜索词' : '目前没有任何作业，点击添加按钮创建新作业'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredHomeworks.map((homework) => (
              <div key={homework.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-lg">{homework.title}</h3>
                    <p className="text-sm text-muted-foreground">{homework.course_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(homework.status)}`}>
                      {getStatusName(homework.status)}
                    </span>
                    <span className="text-sm font-medium">{homework.total_score}分</span>
                  </div>
                </div>
                <p className="text-sm mb-3 line-clamp-2">{homework.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <span>截止日期: {formatDueDate(homework.due_date)}</span>
                    <span className="ml-4">{getRemainingTime(homework.due_date)}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <FileText size={16} />
                    <span>查看详情</span>
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