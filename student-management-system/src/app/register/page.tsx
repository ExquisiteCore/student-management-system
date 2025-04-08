"use client";

import { PATHS } from "@/lib/path";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
//import { post } from "@/lib/http";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { info } from "@/lib/log";
import { post } from "@/lib/http";

const formSchema = z.object({
  username: z.string().min(2, { message: "用户名至少需要2个字符" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" }),
  display_name: z.string().optional(),
  avatar_url: z.string().url({ message: "请输入有效的URL地址" }).optional(),
  bio: z.string().optional(),
  grade: z.number().min(1).max(12, { message: "年级必须在1-12之间" }),
  parent_name: z.string().min(2, { message: "家长姓名至少需要2个字符" }),
  parent_phone: z.string().regex(/^1[3-9]\d{9}$/, { message: "请输入有效的手机号码" }),
  address: z.string().min(5, { message: "地址至少需要5个字符" }),
  notes: z.string().optional()
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      display_name: "",
      avatar_url: "",
      bio: "",
      grade: 1,
      parent_name: "",
      parent_phone: "",
      address: "",
      notes: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 准备注册数据，包含用户和学生相关字段
      const registerData = {
        username: values.username,
        email: values.email,
        password: values.password,
        display_name: values.display_name || undefined,
        avatar_url: values.avatar_url || undefined,
        bio: values.bio || undefined,
        role: "student",
        grade: values.grade,
        parent_name: values.parent_name,
        parent_phone: values.parent_phone,
        address: values.address,
        notes: values.notes || undefined
      };

      info('发送注册请求:', { ...registerData, password: '***' });

      // 调用注册API，指定返回类型并确保withToken为false
      await post<{ id: string }>("/users/register", registerData, { withToken: false });

      // 注册成功后跳转到登录页面
      router.push(PATHS.AUTH_SIGN_IN);
    } catch (error) {
      info('注册错误:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : '注册失败'
      });
      // 清除密码字段
      form.setValue('password', '');
      form.setValue('avatar_url', '');
    }
  }

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[640px] max-w-[95vw] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-[700px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户注册</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>欢迎注册EC的博客</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 w-full max-w-full">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入邮箱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入显示名称（可选）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入头像URL（可选）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入个人简介（可选）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" placeholder="请输入年级(1-12)" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入家长姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入家长手机号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入地址" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="备注（可选）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive col-span-2">
                {form.formState.errors.root.message}
              </div>
            )}
            <Button type="submit" variant="default" className="w-full gap-4 flex justify-center col-span-2">
              注册
            </Button>
          </form>
        </Form>
        <CardFooter className="px-6">
          <div className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或者
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                className="w-full"
                type="button"
                onClick={handleGoHome}
              >
                回首页
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleGoLogin}
              >
                去登录
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  function handleGoHome() {
    router.push(PATHS.SITE_HOME);
  }

  function handleGoLogin() {
    router.push(PATHS.AUTH_SIGN_IN);
  }
}