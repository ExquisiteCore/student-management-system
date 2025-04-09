'use client';

import { useState } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { post } from '@/lib/http';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { info } from '@/lib/log';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Store } from '@tauri-apps/plugin-store';
import { AuthState } from '@/lib/types';

// 定义表单验证模式
const formSchema = z.object({
  title: z.string().min(2, { message: "标题至少需要2个字符" }),
  content: z.string().min(5, { message: "内容至少需要5个字符" }),
  is_important: z.boolean().default(false),
  expires_at: z.string().optional(),
});

// 定义公告创建响应类型
interface AnnouncementResponse {
  id: string;
  title: string;
  content: string;
  publisher_id: string;
  publisher_name: string;
  is_important: boolean;
  published_at: number[];
  expires_at?: number[];
}

export function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      is_important: false,
      expires_at: "",
    },
  });

  // 提交表单
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      info('发送创建公告请求:', values);

      // 从localStorage获取用户信息
      const authStore = await Store.load("auth.dat");
      const authData = await authStore.get("auth") as AuthState;

      if (!authData || !authData.user) {
        throw new Error("用户未登录");
      }

      // 准备请求数据
      const requestData = {
        ...values,
        // 如果expires_at为空字符串，则设置为undefined
        expires_at: values.expires_at && values.expires_at.trim() !== "" ? values.expires_at : undefined,
        // 添加必要的发布者信息
        publisher_id: authData.user.id,
        publisher_name: authData.user.display_name || authData.user.username,
        publisher_role: authData.user.role
      };

      // 发送创建公告请求
      await post<AnnouncementResponse>('/announcement', requestData);

      // 重置表单并关闭对话框
      form.reset();
      setOpen(false);

      // 这里可以添加成功提示或刷新公告列表的逻辑
    } catch (error) {
      info('创建公告失败:', error);
      // 设置表单错误
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : '创建公告失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle size={18} />
          创建公告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建系统公告</DialogTitle>
          <DialogDescription>
            创建一条新的系统公告，将显示在首页公告区域
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公告标题</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入公告标题" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公告内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入公告内容"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_important"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>重要公告</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        标记为重要的公告将会被特殊显示
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>过期时间 (可选)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder="选择过期日期"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "创建公告"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}