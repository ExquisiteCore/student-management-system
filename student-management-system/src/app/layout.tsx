import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LoggingInitializer } from "@/components/logging-initializer";
import { info } from "@/lib/log";

export const metadata: Metadata = {
  title: "写给姐姐的学生管理系统",
  description: "记录学生信息的系统",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  info("root layout启动");
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="overflow-x-clip scroll-smooth">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <LoggingInitializer />
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
