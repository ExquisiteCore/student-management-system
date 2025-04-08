'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Student = {
  id: string;
  name: string;
  class_name?: string;
  student_id?: string;
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
      // 这里应该调用API进行搜索，目前使用模拟数据
      // 实际项目中应该替换为真实的API调用
      setTimeout(() => {
        const mockResults: Student[] = [
          { id: '1', name: '张三', class_name: '一年级一班', student_id: '20230001' },
          { id: '2', name: '李四', class_name: '一年级二班', student_id: '20230002' },
        ].filter(student =>
          student.name.includes(searchQuery) ||
          student.student_id?.includes(searchQuery)
        );

        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);
    } catch (error) {
      console.error('搜索学生失败:', error);
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