/**
 * 统一 API 客户端（前端数据访问层的底座）。
 *
 * 职责：
 * - 创建唯一配置的 axios 实例（baseURL、超时、Cookie 凭据）；
 * - 请求拦截：注入 Bearer token（可选）与 X-Request-ID 追踪头；
 * - 响应拦截：把 HTTP / 网络 / 超时 / 取消等各种错误归一化为 ApiError；
 * - 401 通过外部注入的处理器上抛，埋点失败只记录方法、状态码与脱敏路径。
 *
 * 架构位置：位于 lib/telemetry（横切关注点）之上，供 api/todos、api/users 等业务 API 模块
 * 直接复用；业务层只面对泛型 api 方法与 ApiError，不接触 axios 细节。
 */
import { telemetry } from '@/lib/telemetry';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * 归一化后的 API 错误：业务侧只需处理这一种类型。
 *
 * 设计决策：后端错误体（error.code/message/details）、网关 requestId、网络异常、超时、取消
 * 被统一收敛为同一个 Error 子类，调用方通过 `error.code` 分支即可，无需区分 axios 错误形态。
 * - `status` 保留 HTTP 状态码（网络类错误无此字段）；
 * - `requestId` 便于用户反馈时与后端日志对齐；
 * - `code` 缺失时兜底为 'UNKNOWN'，保证始终可判别。
 */
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

/**
 * 401（认证失效）处理器插槽。
 * 由 main.tsx 中的 ApiAuthSync 在应用启动后注入：跳登录 + 清缓存 + 刷新会话。
 * 设计决策：api 层不反向依赖 auth/router，避免循环依赖，也让测试可独立替换处理器。
 * @param handler 收到 401 时调用的回调
 */
let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

/**
 * 注入 Bearer token 提供器，供请求拦截器使用。
 * 当前认证走 HttpOnly Cookie，因此默认不设置 token；此处保留扩展点，
 * 未来切换到 token 认证时只需提供一个读取器，无需改动拦截器。
 * @param provider 返回 token 字符串或 null/undefined（表示不注入）
 */
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

// 请求拦截：为每个请求打上唯一 X-Request-ID（便于与后端日志串联），
// 并在 tokenProvider 存在时注入 Authorization: Bearer <token>。
// 调用方已显式设置的头不覆盖（如调用第三方 API 或模拟登录场景）。
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenProvider?.();
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  if (!config.headers.has('X-Request-ID')) {
    config.headers.set('X-Request-ID', crypto.randomUUID());
  }
  return config;
});

// 响应拦截（埋点接入点）：成功响应直接放行；失败响应在此归一化、打点并按需触发 401 处理。
// 埋点只记录 HTTP 方法、状态码与脱敏后的路径（去 query、截断长度），绝不携带请求体或敏感参数。
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
      // 埋点：记录 API 失败（不记 body/参数，只记方法与状态码）
      const request = err.config;
      telemetry.track('api_error', {
        method: (request?.method ?? 'unknown').toUpperCase(),
        status,
        code: error.code,
        path: ((request?.url ?? '').split('?')[0] ?? '').slice(0, 200),
      });
      // 会话过期（401）：只通知外部处理器（ApiAuthSync 注入），不在此处硬编码路由跳转，
      // 保证 api 层与路由/会话解耦，同时避免每个业务请求各自处理 401。
      if (status === 401) onUnauthorized?.();
      return Promise.reject(error);
    }
    // 网络错误 / 超时 / 取消：同样打埋点（否则断网/CORS 场景会成为可观测性盲区）
    const path = ((err.config?.url ?? '').split('?')[0] ?? '').slice(0, 200);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      telemetry.track('api_error', {
        code: 'TIMEOUT',
        method: (err.config?.method ?? 'unknown').toUpperCase(),
        path,
      });
      return Promise.reject(new ApiError({ code: 'TIMEOUT', message: '请求超时，请稍后重试' }));
    }
    if (axios.isCancel(err)) {
      // 主动取消（如乐观更新前的 cancelQueries）是正常流程，不打点避免噪音
      return Promise.reject(new ApiError({ code: 'CANCELLED', message: '请求已取消' }));
    }
    telemetry.track('api_error', {
      code: 'NETWORK',
      method: (err.config?.method ?? 'unknown').toUpperCase(),
      path,
    });
    return Promise.reject(
      new ApiError({ code: 'NETWORK', message: err.message || '网络连接失败' }),
    );
  },
);

/**
 * 类型化 API 客户端：每个方法都接受期望的响应泛型 `T`，直接 `Promise<T>` 返回响应体，
 * 调用方无需再写 `const { data } = await ...` 或手动类型断言。
 * 所有方法共享同一个 axios 实例，因此拦截器、baseURL、错误处理策略完全一致。
 * @typeParam T 响应体类型；delete 默认为 void
 */
export const api = {
  /**
   * 发起 GET 请求。
   * @param url 相对路径
   * @param config 额外 axios 配置（如 params）
   * @returns 响应体 T
   */
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<T>(url, config).then((res) => res.data);
  },
  /**
   * 发起 POST 请求。
   * @param url 相对路径
   * @param body 请求体
   * @param config 额外 axios 配置
   * @returns 响应体 T
   */
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<T>(url, body, config).then((res) => res.data);
  },
  /**
   * 发起 PATCH 请求（局部更新）。
   * @param url 相对路径
   * @param body 请求体
   * @param config 额外 axios 配置
   * @returns 响应体 T
   */
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch<T>(url, body, config).then((res) => res.data);
  },
  /**
   * 发起 PUT 请求（整体替换）。
   * @param url 相对路径
   * @param body 请求体
   * @param config 额外 axios 配置
   * @returns 响应体 T
   */
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put<T>(url, body, config).then((res) => res.data);
  },
  /**
   * 发起 DELETE 请求。
   * @param url 相对路径
   * @param config 额外 axios 配置
   * @returns 响应体 T（默认 void）
   */
  delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<T>(url, config).then((res) => res.data);
  },
};

/**
 * 暴露原始 axios 实例，供确实需要底层能力的场景使用（下载文件、上传进度监听、取消请求等）。
 * 常规 CRUD 请优先使用上方的泛型 `api`，以保持错误处理与埋点行为一致。
 */
export const apiClient = instance;
