import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/** 归一化后的 API 错误：业务侧只需处理这一种类型 */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(init: {
    message: string;
    code?: string;
    status?: number;
    requestId?: string;
    details?: unknown;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.code = init.code ?? 'UNKNOWN';
    this.status = init.status;
    this.requestId = init.requestId;
    this.details = init.details;
  }
}

type ErrorBody = {
  error?: { code?: string; message?: string; details?: unknown };
  requestId?: string;
};

/** 认证失效回调：由 main.tsx 注入，避免 api 层反向依赖 auth/router */
let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/** 供请求拦截器注入 Bearer token（当前认证走 Cookie，保留扩展点） */
let tokenProvider: (() => string | null | undefined) | undefined;
export function setTokenProvider(provider: () => string | null | undefined) {
  tokenProvider = provider;
}

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// 请求拦截：统一注入 token 与请求追踪 ID
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenProvider?.();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('X-Request-ID', crypto.randomUUID());
  return config;
});

// 响应拦截：把各种错误形态收敛成 ApiError
instance.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<ErrorBody>) => {
    if (err.response) {
      const { status, data, headers } = err.response;
      const body = data ?? {};
      const error = new ApiError({
        status,
        code: body.error?.code ?? 'HTTP_ERROR',
        message: body.error?.message ?? `请求失败 (${status})`,
        requestId: body.requestId ?? (headers['x-request-id'] as string | undefined),
        details: body.error?.details,
      });
      // 会话过期：交给外部处理的跳登录 / 刷新逻辑，不在此处硬编码路由
      if (status === 401) onUnauthorized?.();
      return Promise.reject(error);
    }
    // 网络错误 / 超时 / 取消
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return Promise.reject(new ApiError({ code: 'TIMEOUT', message: '请求超时，请稍后重试' }));
    }
    if (axios.isCancel(err)) {
      return Promise.reject(new ApiError({ code: 'CANCELLED', message: '请求已取消' }));
    }
    return Promise.reject(
      new ApiError({ code: 'NETWORK', message: err.message || '网络连接失败' }),
    );
  },
);

/**
 * 类型化 API 客户端：业务层用 api.get<T>() 直接得到 T，
 * 不必每次写 `const { data } = await ...` 再手动断言。
 */
export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<T>(url, config).then((res) => res.data);
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<T>(url, body, config).then((res) => res.data);
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch<T>(url, body, config).then((res) => res.data);
  },
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put<T>(url, body, config).then((res) => res.data);
  },
  delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<T>(url, config).then((res) => res.data);
  },
};

/** 需要访问原始 axios 实例时（如下载、进度监听）从这里取 */
export const apiClient = instance;
