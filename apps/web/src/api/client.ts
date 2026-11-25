import axios from 'axios';

/** 统一 axios 实例：baseURL + 错误归一化 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message ?? err.message ?? '请求失败';
    return Promise.reject(new Error(message));
  },
);
