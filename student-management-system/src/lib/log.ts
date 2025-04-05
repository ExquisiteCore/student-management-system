import {
  trace as tauriTrace,
  info as tauriInfo,
  error as tauriError,
  warn as tauriWarn,
  debug as tauriDebug,
  attachConsole,
} from "@tauri-apps/plugin-log";

// 检查当前是否在Tauri环境中运行
const isTauriEnvironment = () => {
  return typeof window !== "undefined" && window !== null && "tauri" in window;
};

// 日志初始化状态
let isInitialized = false;
let detachFunction: (() => void) | null = null;

/**
 * 初始化日志系统
 * 在Tauri环境中连接到Tauri日志系统，在非Tauri环境中使用console
 */
export const initializeLogging = async (): Promise<void> => {
  // 避免重复初始化
  if (isInitialized) return;

  try {
    if (isTauriEnvironment()) {
      // Tauri环境：连接到Tauri日志系统
      detachFunction = await attachConsole();
      isInitialized = true;
    } else {
      // 非Tauri环境：只标记为已初始化
      console.info("非Tauri环境，使用浏览器控制台作为日志输出");
      isInitialized = true;
    }
  } catch (err) {
    console.error("日志初始化失败:", err);
    throw err;
  }
};

/**
 * 分离日志控制台（仅在Tauri环境中有效）
 */
export const detachLogging = (): void => {
  if (detachFunction && isTauriEnvironment()) {
    detachFunction();
    detachFunction = null;
  }
  isInitialized = false;
};

// 为了向后兼容性保留原有的enableLogging函数
export const enableLogging = initializeLogging;

/**
 * 跟踪级别日志
 * @param message 日志消息
 * @param optionalParams 可选参数
 */
export const trace = (message: string, ...optionalParams: unknown[]): void => {
  if (isTauriEnvironment()) {
    tauriTrace(message);
    // Tauri日志API不支持额外参数，如果有额外参数则使用console输出
    if (optionalParams.length > 0) {
      console.trace(message, ...optionalParams);
    }
  } else {
    console.trace(message, ...optionalParams);
  }
};

/**
 * 调试级别日志
 * @param message 日志消息
 * @param optionalParams 可选参数
 */
export const debug = (message: string, ...optionalParams: unknown[]): void => {
  if (isTauriEnvironment()) {
    tauriDebug(message);
    if (optionalParams.length > 0) {
      console.debug(message, ...optionalParams);
    }
  } else {
    console.debug(message, ...optionalParams);
  }
};

/**
 * 信息级别日志
 * @param message 日志消息
 * @param optionalParams 可选参数
 */
export const info = (message: string, ...optionalParams: unknown[]): void => {
  if (isTauriEnvironment()) {
    tauriInfo(message);
    if (optionalParams.length > 0) {
      console.info(message, ...optionalParams);
    }
  } else {
    console.info(message, ...optionalParams);
  }
};

/**
 * 警告级别日志
 * @param message 日志消息
 * @param optionalParams 可选参数
 */
export const warn = (message: string, ...optionalParams: unknown[]): void => {
  if (isTauriEnvironment()) {
    tauriWarn(message);
    if (optionalParams.length > 0) {
      console.warn(message, ...optionalParams);
    }
  } else {
    console.warn(message, ...optionalParams);
  }
};

/**
 * 错误级别日志
 * @param message 日志消息
 * @param optionalParams 可选参数
 */
export const error = (message: string, ...optionalParams: unknown[]): void => {
  if (isTauriEnvironment()) {
    tauriError(message);
    if (optionalParams.length > 0) {
      console.error(message, ...optionalParams);
    }
  } else {
    console.error(message, ...optionalParams);
  }
};

// 导出日志级别常量，方便使用
export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// 导出统一的日志接口
export const logger = {
  trace,
  debug,
  info,
  warn,
  error,
  init: initializeLogging,
  detach: detachLogging,
  level: LogLevel,
};

// 默认导出logger对象，方便使用
export default logger;
