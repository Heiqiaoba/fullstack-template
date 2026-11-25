/**
 * 请求鉴权上下文模块：把 Better Auth 会话解析成结构化的 AuthContext，
 * 并提供供 Fastify 路由 onRequest 钩子使用的三档守卫。
 *
 * 依赖 lib/auth（调用 auth.api.getSession）与 lib/errors（抛出统一业务错误），
 * 通过 Fastify 模块增强把 auth 字段挂到 req 上，避免各路由重复解析会话。
 *
 * 分工（按"解析—挂载—校验—读取"递进）：
 * - resolveSession：底层解析函数，只负责 cookie → AuthContext 的纯转换，无副作用、不拦截；
 * - optionalAuth / requireAuth：钩子层，前者静默挂载、后者强制登录；
 * - requireAdmin：在 requireAuth 之上叠加角色校验；
 * - getAuth：路由处理器中类型安全地读取已挂载上下文，避免非空断言散落各处。
 */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { auth } from './auth';
import { Errors } from './errors';

/**
 * 鉴权上下文：路由处理器唯一应消费的用户身份信息。
 * 只保留 userId/sessionId/role，刻意不带 email 等字段，减少敏感数据扩散。
 */
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

/**
 * 底层会话解析：从请求 cookie 调用 Better Auth 获取会话并转成 AuthContext。
 *
 * 关键设计决策：
 * - 无 cookie / 无有效会话返回 null 而非抛错，让可选鉴权路径保持无感；
 * - 封禁用户显式抛 forbidden，且区分"业务错误"与"解析异常"：
 *   带 statusCode 的错误（如 AppError）向外传播，其余解析失败一律降级为 null；
 * - role 只识别 admin，其余一律收敛为 user，防止未知角色越权。
 *
 * @param req 当前 Fastify 请求（读取 cookie 头）
 * @returns 会话上下文；未登录或会话无效时返回 null
 */
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

/**
 * 可选鉴权钩子：解析成功则挂 req.auth，失败保持 undefined，请求继续。
 * 适用于埋点等"有身份更好、无身份也放行"的场景。
 */
export async function optionalAuth(req: FastifyRequest) {
  req.auth = (await resolveSession(req)) ?? undefined;
}

/**
 * 强制鉴权钩子：无有效会话抛 401（由统一错误处理器转成响应）。
 * 挂在路由 onRequest 上，确保处理器执行前身份已就绪。
 */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  const ctx = await resolveSession(req);
  if (!ctx) throw Errors.unauthorized('Sign in required');
  req.auth = ctx;
}

/**
 * 管理员守卫：先复用 requireAuth 完成登录校验，再检查角色。
 * 依赖"必须先经过 requireAuth"的语义保证 req.auth 已存在，避免重复解析会话。
 */
export async function requireAdmin(req: FastifyRequest, _reply: FastifyReply) {
  await requireAuth(req, _reply);
  if (req.auth?.role !== 'admin') throw Errors.forbidden('Admin access required');
}

/**
 * 受保护路由中的上下文读取器：缺失时抛 401，保证返回类型非空。
 * 存在意义是替代散落在各处的 `req.auth!`，把"路由已挂鉴权钩子"的约定
 * 变成运行期可检查的不变量。
 */
export function getAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw Errors.unauthorized('Sign in required');
  return req.auth;
}
