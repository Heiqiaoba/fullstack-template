import type { FastifyReply, FastifyRequest } from 'fastify';
import { auth } from './auth';
import { Errors } from './errors';

export type AuthContext = {
  userId: string;
  sessionId: string;
  role: 'admin' | 'user';
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

/** 从请求 cookie 解析会话；无会话返回 null，不抛错 */
export async function resolveSession(req: FastifyRequest): Promise<AuthContext | null> {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  try {
    const headers = new Headers();
    headers.set('cookie', cookie);
    const result = await auth.api.getSession({ headers });
    if (!result?.session || !result.user) return null;
    const user = result.user as { id: string; role?: string | null; banned?: boolean | null };
    if (user.banned) throw Errors.forbidden('Account is banned');
    return {
      userId: user.id,
      sessionId: result.session.id,
      role: user.role === 'admin' ? 'admin' : 'user',
    };
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) throw err;
    return null;
  }
}

/** 可选鉴权：挂 req.auth，不拦截 */
export async function optionalAuth(req: FastifyRequest) {
  req.auth = (await resolveSession(req)) ?? undefined;
}

/** 强制鉴权：无有效会话抛 401（由统一错误处理器转成响应） */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  const ctx = await resolveSession(req);
  if (!ctx) throw Errors.unauthorized('Sign in required');
  req.auth = ctx;
}

/** 管理员守卫：必须先经过 requireAuth */
export async function requireAdmin(req: FastifyRequest, _reply: FastifyReply) {
  await requireAuth(req, _reply);
  if (req.auth?.role !== 'admin') throw Errors.forbidden('Admin access required');
}

/** 在受保护路由中安全取得鉴权上下文（类型安全，避免非空断言） */
export function getAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw Errors.unauthorized('Sign in required');
  return req.auth;
}
