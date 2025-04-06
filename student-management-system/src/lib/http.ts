import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";
import { jwtDecode } from "jwt-decode";

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
    authStore = await Store.get(AUTH_STORE_PATH);
  }
  // 确保返回非空的Store实例
  if (!authStore) {
    throw new Error("无法初始化存储");
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
    const hasAuth = await store.has("auth");
    if (!hasAuth) return null;

    const authData = await store.get("auth");
    return authData as AuthData;
  } catch (error) {
    console.error("获取认证信息失败:", error);
    return null;
  }
}

// 保存认证信息
async function saveAuthData(authData: Record<string, unknown>): Promise<void> {
  try {
    const store = await initStore();
    await store.set("auth", authData);
    await store.save();
  } catch (error) {
    console.error("保存认证信息失败:", error);
  }
}

// 刷新token的函数
async function refreshToken(): Promise<string | null> {
  try {
    const authData = await getAuthData();
    if (!authData || !authData.token) return null;

    const oldToken = authData.token;

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
      const newAuthData = { ...authData, token: newToken };
      await saveAuthData(newAuthData);
      return newToken;
    }
    return null;
  } catch (error) {
    console.error("刷新token失败:", error);
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
    console.error("解析token失败:", e);
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
    console.error("解析token失败:", e);
    return false;
  }
}

// 添加认证头
async function addAuthHeader(
  headers: Record<string, string> = {},
  withToken: boolean = true
): Promise<Record<string, string>> {
  if (!withToken) return headers;

  try {
    const authData = await getAuthData();
    if (!authData || !authData.token) return headers;

    const token = authData.token;

    // 检查token是否即将过期
    if (shouldRefreshToken(token)) {
      const newToken = await refreshToken();
      if (newToken) {
        return { ...headers, Authorization: `Bearer ${newToken}` };
      }
    }

    return { ...headers, Authorization: `Bearer ${token}` };
  } catch (e) {
    console.error("处理认证信息失败:", e);
    return headers;
  }
}

// 处理响应
async function handleResponse<T>(
  response: Response,
  responseType: ResponseType = ResponseType.JSON
): Promise<T> {
  if (!response.ok) {
    let errorMessage = "请求失败";
    let errorData: unknown = null;

    try {
      errorData = await response.json();
      // 添加类型守卫确保errorData是对象且具有message属性
      if (
        errorData &&
        typeof errorData === "object" &&
        "message" in errorData
      ) {
        errorMessage = (errorData as { message: string }).message;
      }
    } catch (e) {
      console.error("解析响应数据失败:", e);
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
        console.error("处理token刷新失败:", e);
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
      errorMessage = error.message || errorMessage;
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
  }

  // 创建带有更多信息的错误对象
  const enhancedError = new Error(errorMessage) as HttpError;
  enhancedError.status = typeof errorCode === "number" ? errorCode : undefined;
  enhancedError.data = { code: errorCode, url, message: errorMessage };

  console.error(`API请求错误 [${errorCode}]: ${errorMessage}`, { url });
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
    withToken
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
    const response = await fetch(fullUrl, requestConfig);
    return await handleResponse<T>(response, responseType);
  } catch (error) {
    // 创建重试请求函数
    const retryRequest = async () =>
      request<T>(method, url, data, {
        ...config,
        headers: {
          ...headers,
          "X-Retry": "true",
        },
      });

    return await handleError(error, url, config, retryRequest);
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
