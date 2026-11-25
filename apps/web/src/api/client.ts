import axios from 'axios';

/** 统一 axios 实例：baseURL + 请求追踪 ID + 错误归一化 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    const message = data?.error?.message ?? err.message ?? '请求失败';
    const code = data?.error?.code ?? 'UNKNOWN';
    const requestId = data?.requestId;
    const e = new Error(message) as Error & { code?: string; requestId?: string; status?: number };
    e.code = code;
    e.requestId = requestId;
    e.status = err.response?.status;
    return Promise.reject(e);
  },
);
