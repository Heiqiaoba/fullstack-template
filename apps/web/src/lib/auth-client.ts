/**
 * Better Auth 前端客户端（认证与会话的单一入口）。
 *
 * 架构位置：被 api/client（401 刷新会话）、lib/role（读取角色）、
 * components/AuthGuard（会话守卫）与 routes/Login、Admin 共同使用。
 */
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
 *
 * @returns 配置好的 Better Auth 客户端实例
 */
export const authClient = createAuthClient({
  // 防御式读取 window：模块顶层直接访问会在非浏览器环境（SSR/未来测试）抛 ReferenceError
  baseURL: typeof window === 'undefined' ? '' : window.location.origin,
  basePath: '/api/auth',
  plugins: [adminClient()],
});

/**
 * 常用认证能力的具名导出，业务代码无需再写 `authClient.signIn` 等完整路径：
 * - signIn / signUp / signOut：登录、注册、退出（邮件密码方式）；
 * - useSession：读取会话状态的 React hook；
 * - getSession：命令式获取会话（ApiAuthSync 在 401 后刷新会话时使用）。
 */
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

/**
 * 退出登录并清理本地缓存状态的一站式封装。
 *
 * 为什么需要：直接调 signOut() 只清服务端会话，TanStack Query 缓存里仍残留
 * 该用户的数据（5 分钟 gcTime 内可见），切换账号会造成数据串号。
 * 401 路径由 ApiAuthSync 统一处理；本函数覆盖「用户主动退出」路径。
 */
export async function signOutAndClear() {
  try {
    await signOut();
  } finally {
    // 即使 signOut 网络失败也要清本地缓存：本地已无有效会话，残留数据只会误导
    const { queryClient } = await import('./queryClient');
    void queryClient.cancelQueries();
    queryClient.clear();
  }
}
