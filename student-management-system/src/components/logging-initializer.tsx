"use client"

import { useEffect, useState } from "react";
import { enableLogging } from "@/lib/log";

export function LoggingInitializer() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initLogging = async () => {
      try {
        await enableLogging();
      } catch (err) {
        console.error("日志初始化失败:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initLogging();
  }, []);

  // 如果只是为了调试，可以在开发环境显示错误
  if (error && process.env.NODE_ENV === 'development') {
    return (
      <div style={{ display: 'none' }}>
        {/* 错误信息不显示在UI上，但可以在React DevTools中查看 */}
      </div>
    );
  }

  return null; // 这个组件不渲染任何内容
}