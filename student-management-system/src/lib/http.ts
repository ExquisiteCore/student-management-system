import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";
import { jwtDecode } from "jwt-decode";
import { info } from "./log";

// 导入Response类型
type Response = globalThis.Response;

// 自定义ResponseType枚举，替代原来的导入
enum ResponseType {
  JSON = "json",
  TEXT = "text",
  BINARY = "binary",
  ARRAYBUFFER = "arraybuffer",
}

// 使用字符串字面量类型替代原来的HttpVerb枚举
type HttpVerb =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

// 定义请求配置接口
interface RequestConfig {
  headers?: Record<string, string>;
  responseType?: ResponseType;
  timeout?: number;
  withToken?: boolean;
  token?: string;
  body?: string | FormData | Blob;
  [key: string]: unknown;
}

// 定义错误接口
interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

const BASE_API_URL = "http://127.0.0.1:8080/api";
const AUTH_STORE_PATH = "auth.dat";

// 创建存储实例
let authStore: Store | null = null;

// 初始化存储
async function initStore(): Promise<Store> {
  if (!authStore) {
    try {
      authStore = await Store.get(AUTH_STORE_PATH);
      // 确保返回非空的Store实例
      if (!authStore) {
        // 如果Store.get返回undefined，创建一个新的Store实例
        authStore = await Store.load(AUTH_STORE_PATH);
      }
    } catch (error) {
      info("Store初始化错误:", error);
      // 如果获取失败，创建一个新的Store实例
      authStore = await Store.load(AUTH_STORE_PATH);
    }
  }
  return authStore;
}

// 获取认证信息
interface AuthData {
  token?: string;
  [key: string]: unknown;
}

async function getAuthData(): Promise<AuthData | null> {
  try {
    const store = await initStore();
    // 先检查store是否有效
    if (!store) {
      info("存储实例无效");
      return null;
    }

    try {
      const hasAuth = await store.has("auth");
      if (!hasAuth) return null;

      const authData = await store.get("auth");
      return authData as AuthData;
    } catch (storeError) {
      info("存储操作失败:", storeError);
      return null;
    }
  } catch (error) {
    info("获取认证信息失败:", error);
    return null;
  }
}

// 保存认证信息
async function saveAuthData(authData: Record<string, unknown>): Promise<void> {
  try {
    const store = await initStore();
    // 确保store实例有效
    if (!store) {
      info("存储实例无效，无法保存认证信息");
      return;
    }

    try {
      await store.set("auth", authData);
      await store.save();
    } catch (storeError) {
      info("存储操作失败:", storeError);
    }
  } catch (error) {
    info("保存认证信息失败:", error);
  }
}

// 刷新token的函数
async function refreshToken(): Promise<string | null> {
  try {
    const authData = await getAuthData();
    if (!authData || !authData.token) return null;

    const oldToken = authData.token;

    try {
      // 调用刷新接口
      const response = await fetch(
        `${BASE_API_URL}${BASE_API_URL.endsWith("/") ? "" : "/"}auth/refresh`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${oldToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`刷新Token失败: ${response.status}`);
      }

      const data = await response.json();
      const newToken = data.token;

      if (newToken) {
        try {
          const newAuthData = { ...authData, token: newToken };
          await saveAuthData(newAuthData);
          return newToken;
        } catch (saveError) {
          info("保存新token失败:", saveError);
          return null;
        }
      }
      return null;
    } catch (fetchError) {
      info("刷新token请求失败:", fetchError);
      return null;
    }
  } catch (error) {
    info("刷新token失败:", error);
    return null;
  }
}

// 检查token是否需要刷新（过期前30分钟内）
function shouldRefreshToken(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (!decoded.exp) return false;

    // 获取当前时间戳（秒）
    const now = Math.floor(Date.now() / 1000);

    // 如果token将在30分钟内过期，则刷新
    return decoded.exp - now < 30 * 60 && decoded.exp > now;
  } catch (e) {
    info("解析token失败:", e);
    return false;
  }
}

// 检查token是否已过期但在刷新窗口内（过期后30分钟内）
function isTokenInRefreshWindow(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (!decoded.exp) return false;

    // 获取当前时间戳（秒）
    const now = Math.floor(Date.now() / 1000);

    // 如果token已过期但在刷新窗口内（过期后30分钟内）
    return decoded.exp < now && now - decoded.exp <= 30 * 60;
  } catch (e) {
    info("解析token失败:", e);
    return false;
  }
}

// 添加认证头
async function addAuthHeader(
  headers: Record<string, string> = {},
  withToken: boolean = true,
  token?: string
): Promise<Record<string, string>> {
  if (!withToken) return headers;

  try {
    // 如果提供了token，优先使用提供的token
    if (token) {
      return { ...headers, Authorization: `Bearer ${token}` };
    }

    const authData = await getAuthData();
    if (!authData || !authData.token) return headers;

    const storedToken = authData.token;

    // 检查token是否即将过期
    if (shouldRefreshToken(storedToken)) {
      const newToken = await refreshToken();
      if (newToken) {
        return { ...headers, Authorization: `Bearer ${newToken}` };
      }
    }

    return { ...headers, Authorization: `Bearer ${storedToken}` };
  } catch (e) {
    info("处理认证信息失败:", e);
    return headers;
  }
}

// 处理响应
async function handleResponse<T>(
  response: Response,
  responseType: ResponseType = ResponseType.JSON
): Promise<T> {
  info("处理响应:", {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorMessage = "请求失败";
    let errorData: unknown = null;

    try {
      // 克隆响应以避免消耗响应流
      const clonedResponse = response.clone();
      try {
        errorData = await clonedResponse.json();
        info("错误响应数据:", errorData);
        // 添加类型守卫确保errorData是对象且具有message属性
        if (
          errorData &&
          typeof errorData === "object" &&
          "message" in errorData
        ) {
          errorMessage = (errorData as { message: string }).message;
        }
      } catch (jsonError) {
        info("解析响应JSON失败:", jsonError);
        // 如果无法解析为JSON，尝试获取文本内容
        try {
          const textContent = await response.text();
          info("响应文本内容:", textContent);
          errorData = { text: textContent };
          if (textContent) {
            errorMessage = textContent;
          }
        } catch (textError) {
          info("解析响应文本失败:", textError);
        }
      }
    } catch (e) {
      info("解析响应数据失败:", e);
      // 如果无法解析JSON，使用状态文本
      errorMessage = response.statusText || errorMessage;
    }

    // 创建HttpError实例并设置属性
    const httpError = new Error(errorMessage) as HttpError;
    httpError.status = response.status;
    httpError.data = errorData;
    throw httpError;
  }

  // 根据responseType处理响应数据
  switch (responseType) {
    case ResponseType.JSON:
      return (await response.json()) as T;
    case ResponseType.TEXT:
      return (await response.text()) as unknown as T;
    case ResponseType.BINARY:
    case ResponseType.ARRAYBUFFER:
      return (await response.arrayBuffer()) as unknown as T;
    default:
      return (await response.json()) as T;
  }
}

// 处理错误
// 定义网络错误类型
interface NetworkError {
  type: "aborted" | "timeout" | "network";
  message?: string;
}

async function handleError(
  error: Error | NetworkError | unknown,
  url: string,
  config: RequestConfig,
  retryRequest?: () => Promise<unknown>
): Promise<never> {
  let errorMessage = "请求失败";
  let errorCode: string | number = "UNKNOWN_ERROR";

  // 记录原始错误信息，帮助调试
  info("原始错误信息:", error);

  if (error instanceof Error) {
    // 使用类型守卫而不是类型断言
    const httpError = error as HttpError;

    // 处理401错误（未授权）
    if (
      httpError.status === 401 &&
      !url.includes("/auth/refresh") &&
      retryRequest
    ) {
      try {
        const authData = await getAuthData();
        if (authData && authData.token) {
          const token = authData.token;

          // 检查token是否在刷新窗口内
          if (isTokenInRefreshWindow(token)) {
            // 尝试刷新token
            const newToken = await refreshToken();

            if (newToken) {
              console.log("Token已刷新，重新发送请求");
              // 重新发送原始请求
              return (await retryRequest()) as never;
            }
          }
        }
      } catch (e) {
        info("处理token刷新失败:", e);
      }

      errorMessage = "未授权，请重新登录";
      errorCode = 401;
    } else if (httpError.status === 422) {
      errorMessage = "用户名或密码格式不正确";
      errorCode = 422;
    } else if (httpError.status === 403) {
      errorMessage = "拒绝访问，没有操作权限";
      errorCode = 403;
    } else if (httpError.status === 404) {
      errorMessage = "请求的资源不存在";
      errorCode = 404;
    } else if (httpError.status === 500) {
      errorMessage = "服务器内部错误";
      errorCode = 500;
    } else if (httpError.status) {
      errorMessage = `HTTP错误: ${httpError.status} - ${
        error.message || errorMessage
      }`;
      errorCode = httpError.status;
    } else {
      // 处理没有status属性的Error对象
      errorMessage = error.message || errorMessage;
      // 检查错误消息中是否包含特定的网络错误关键词
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("failed to fetch") ||
          msg.includes("network") ||
          msg.includes("connection")
        ) {
          errorMessage = "网络错误，无法连接到服务器，请检查网络连接";
          errorCode = "NETWORK_ERROR";
        } else if (msg.includes("timeout")) {
          errorMessage = "请求超时，请检查网络连接";
          errorCode = "REQUEST_TIMEOUT";
        }
      }
    }
  } else if (typeof error === "object" && error !== null && "type" in error) {
    // 使用类型守卫处理网络错误
    const networkError = error as NetworkError;
    if (networkError.type === "aborted") {
      errorMessage = "请求被中止";
      errorCode = "REQUEST_ABORTED";
    } else if (networkError.type === "timeout") {
      errorMessage = "请求超时，请检查网络连接";
      errorCode = "REQUEST_TIMEOUT";
    } else if (networkError.type === "network") {
      errorMessage = "网络错误，无法连接到服务器，请检查网络连接";
      errorCode = "NETWORK_ERROR";
    }
  } else {
    // 处理其他类型的错误
    errorMessage = "未知错误，请检查网络连接或联系管理员";
    info("未知类型的错误:", error);
  }

  // 创建带有更多信息的错误对象
  const enhancedError = new Error(errorMessage) as HttpError;
  enhancedError.status = typeof errorCode === "number" ? errorCode : undefined;
  enhancedError.data = { code: errorCode, url, message: errorMessage };

  info(`API请求错误 [${errorCode}]: ${errorMessage}`, { url });
  throw enhancedError;
}

// 执行请求
// 定义请求数据类型
type RequestData =
  | Record<string, unknown>
  | FormData
  | Blob
  | string
  | null
  | undefined;

async function request<T>(
  method: HttpVerb,
  url: string,
  data?: RequestData,
  config: RequestConfig = {}
): Promise<T> {
  const {
    headers = {},
    responseType = ResponseType.JSON,
    timeout = 10000,
    withToken = true,
    ...restConfig
  } = config;

  // 构建完整URL
  let fullUrl = url.startsWith("http")
    ? url
    : `${BASE_API_URL}${url.startsWith("/") ? url : `/${url}`}`;

  // 添加认证头
  const authHeaders = await addAuthHeader(
    {
      "Content-Type": "application/json",
      ...headers,
    },
    withToken,
    config.token
  );

  // 构建请求配置
  const requestConfig: {
    method: HttpVerb;
    headers: Record<string, string>;
    timeout: number;
    body?: string | FormData | Blob;
    [key: string]: unknown;
  } = {
    method,
    headers: authHeaders,
    timeout,
    ...restConfig,
  };

  // 注意：新版本的fetch API不再使用responseType参数
  // 而是通过响应对象的方法来处理不同类型的响应

  // 添加请求体
  if (data) {
    if (method !== "GET" && method !== "HEAD") {
      if (data instanceof FormData || data instanceof Blob) {
        requestConfig.body = data;
      } else if (typeof data === "string") {
        requestConfig.body = data;
      } else {
        requestConfig.body = JSON.stringify(data);
      }
    } else if (
      method === "GET" &&
      data !== null &&
      typeof data === "object" &&
      !(data instanceof FormData) &&
      !(data instanceof Blob)
    ) {
      // 对于GET请求，将数据转换为查询参数
      const params = new URLSearchParams();
      Object.entries(data as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
      );

      const queryString = params.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString;
      }
    }
  }

  // 执行请求并处理响应
  try {
    info(`发送${method}请求到: ${fullUrl}`, {
      method,
      headers: requestConfig.headers,
      hasBody: !!requestConfig.body,
    });

    const response = await fetch(fullUrl, requestConfig);
    return await handleResponse<T>(response, responseType);
  } catch (error) {
    // 记录原始错误
    info(`请求失败 (${method} ${fullUrl}):`, error);

    // 创建重试请求函数
    const retryRequest = async () =>
      request<T>(method, url, data, {
        ...config,
        headers: {
          ...headers,
          "X-Retry": "true",
        },
      });

    // 传递完整URL而不是原始URL给错误处理函数
    return await handleError(error, fullUrl, config, retryRequest);
  }
}

// 封装GET请求
export const get = <T>(
  url: string,
  params?: Record<string, unknown>,
  config?: RequestConfig
): Promise<T> => {
  return request<T>("GET", url, params, config);
};

// 封装POST请求
export const post = <T>(
  url: string,
  data?: RequestData,
  config?: RequestConfig
): Promise<T> => {
  return request<T>("POST", url, data, config);
};

// 封装PUT请求
export const put = <T>(
  url: string,
  data?: RequestData,
  config?: RequestConfig
): Promise<T> => {
  return request<T>("PUT", url, data, config);
};

// 封装DELETE请求
export const del = <T>(url: string, config?: RequestConfig): Promise<T> => {
  return request<T>("DELETE", url, null, config);
};

// 导出HTTP方法
export default {
  get,
  post,
  put,
  delete: del,
  request,
};
