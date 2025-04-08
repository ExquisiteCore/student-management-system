'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { get } from '@/lib/http';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnyARecord } from 'dns';

type Student = {
  id: string;
  name: string;       // 对应用户表的display_name或username
  class_name?: string; // 对应用户表的grade字段转换
  student_id?: string; // 对应用户表的username
  // 其他可能需要的字段
  grade?: number;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  notes?: string;
};

export function SearchStudentDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 处理搜索功能
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 调用API进行搜索，使用http.ts中的get方法
      const data = await get<any[]>(`/users`, {
        role: 'student',
        search: searchQuery
      });

      // 将API返回的用户数据转换为Student类型
      const students: Student[] = data.map((user) => ({
        id: user.id,
        name: user.display_name || user.username,
        class_name: user.grade ? `${user.grade}年级` : '-',
        student_id: user.username,
        grade: user.grade,
        parent_name: user.parent_name,
        parent_phone: user.parent_phone,
        address: user.address,
        notes: user.notes
      }));

      setSearchResults(students);
    } catch (error) {
      console.error('搜索学生失败:', error);
    } finally {
      setIsSearching(false);
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
      <DialogContent className="sm:max-w-md">
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button type="submit" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '搜索中...' : '搜索'}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto border rounded-md">
            <div className="p-2 bg-muted text-xs font-medium grid grid-cols-3">
              <div>姓名</div>
              <div>班级</div>
              <div>学号</div>
            </div>
            {searchResults.map((student) => (
              <div
                key={student.id}
                className="p-2 text-sm grid grid-cols-3 hover:bg-accent cursor-pointer border-t"
                onClick={() => {
                  // 这里可以添加点击学生后的操作，比如跳转到学生详情页
                  console.log('选择了学生:', student);
                  setOpen(false);
                }}
              >
                <div>{student.name}</div>
                <div>{student.class_name || '-'}</div>
                <div>{student.student_id || '-'}</div>
              </div>
            ))}
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="py-2 text-center text-muted-foreground">
            未找到匹配的学生
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
      </DialogContent>
    </Dialog>
  );
}