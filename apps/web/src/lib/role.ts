/**
 * 角色读取工具：把会话中的 role 字段归一化为 'admin' | 'user' | undefined。
 *
 * 注意：这里只做前端展示层的角色判断，不构成安全边界；真正的权限校验在后端 admin 守卫。
 */
import { useSession } from './auth-client';

/**
 * 从当前会话读取用户角色的 hook。
 * @returns 'admin' / 'user' / undefined（未登录或会话尚未加载）
 */
export function useRole(): 'admin' | 'user' | undefined {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined;
}

/**
 * 纯函数版角色判断：给定 session 返回归一化角色，便于在非 hook 场景与测试中复用。
 * 只接受 'admin'/'user' 两种已知值，其它值（含未登录、加载中）一律返回 undefined。
 * @param session 会话对象或 null/undefined
 * @returns 归一化后的角色
 */
export function roleOf(session: { user: { role?: string } } | null | undefined) {
  const role = session?.user?.role;
  return role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined;
}
