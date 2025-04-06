"use client";

import { PATHS } from "@/lib/path";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/http";
import { LoginResponse, AuthState } from "@/lib/types";
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
import { Store } from "@tauri-apps/plugin-store";

const formSchema = z.object({
  username_or_email: z.string().min(5, { message: "用户名或邮箱至少需要5个字符" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" })
});

export default function SignInPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username_or_email: "",
      password: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 使用封装的post方法，指定返回类型为LoginResponse
      const data = await post<LoginResponse>("/users/login", values, { withToken: false });
      // 处理返回的token和用户数据
      if (data && data.token && data.user) {
        const { token, user } = data;

        // 存储用户信息，使用AuthState类型
        const authState: AuthState = {
          token,
          user
        };

        // 使用Tauri的Store API保存认证信息
        const store = await Store.load("auth.dat");
        // 添加空值检查，确保store不为null
        if (store) {
          await store.set("auth", authState);
          await store.save();
        } else {
          info('存储初始化失败');
        }
      }

      router.push(PATHS.SITE_HOME);
    } catch (error) {
      info('登录错误:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : '登录失败'
      });
      // 清除密码字段
      form.setValue('password', '');
    }
  }

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] max-w-[95vw] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户登录</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>欢迎来到EC的博客</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6 w-full max-w-full">
            <FormField
              control={form.control}
              name="username_or_email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入用户名或邮箱" {...field} />
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
            <Button type="submit" variant="default" className="w-full gap-4 flex justify-center">
              登录
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
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleGoHome}
              >
                回首页
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                type="button"
                onClick={handleGoRegister}
              >
                去注册
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

  function handleGoRegister() {
    router.push(PATHS.AUTH_REGISTER);
  }
}
