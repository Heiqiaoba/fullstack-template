import { useSession } from './auth-client';

/** 当前用户角色：admin / user / undefined（未登录或未加载） */
export function useRole(): 'admin' | 'user' | undefined {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined;
}

/** 纯函数版：给定 session 判断角色，便于在非 hook 场景与测试中复用 */
export function roleOf(session: { user: { role?: string } } | null | undefined) {
  const role = session?.user?.role;
  return role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined;
}
