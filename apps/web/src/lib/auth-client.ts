import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * 认证请求始终走同源 origin + /api/auth：
 * - 开发时由 Vite proxy 把 /api 转发到后端 3000
 * - 生产时由 Nginx 把 /api 反向代理到 server 容器
 * 注意不要把带路径的 VITE_API_URL（如 /api/v1）传给 baseURL，
 * better-auth 发现 URL 自带 path 后不会再拼接 basePath，会导致请求打到错误路径。
 *
 * 挂 adminClient 插件后，管理端 API（listUsers/setRole/ban 等）与认证共用同一个客户端：
 *   authClient.admin.listUsers() / setRole() / banUser() ...
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/api/auth',
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
