/**
 * 全局 TanStack Query 缓存实例。
 *
 * 架构位置：在 main.tsx 中通过 QueryClientProvider 注入整棵组件树，
 * 同时被 ApiAuthSync 在 401 时清空缓存，防止会话切换后残留旧用户数据。
 *
 * 默认策略：30 秒内数据视为新鲜（减少重复请求）、失败重试 1 次、
 * 关闭窗口聚焦自动刷新（避免频繁请求打断用户）。
 */
import { QueryClient } from '@tanstack/react-query';

/** 应用共享的 QueryClient 单例 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
