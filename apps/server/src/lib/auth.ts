/**
 * 认证核心模块：创建并导出 Better Auth 单例。
 *
 * 依赖 config/env（URL、签名密钥、管理员 ID、环境标记）与 db/index（连接池 +
 * schema 注册），通过 drizzleAdapter 直接复用项目数据库连接。app.ts 把该实例的
 * Node handler 挂到 /api/auth/*；lib/context 则调用 auth.api.getSession 解析会话。
 * 启用 admin 插件实现 RBAC，邮箱密码认证与数据库会话是默认策略。
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { env, isProd } from '../config/env';
import { db, schema } from '../db';

/**
 * Better Auth 实例：邮箱密码 + 数据库会话，Drizzle adapter 直连本项目连接池。
 *
 * 关键设计决策：
 * - 会话 cookie 在开发/生产使用不同前缀与安全属性，避免本地 cookie 覆盖线上会话；
 * - adminUserIds 来自环境变量且为空时无人是管理员，防止默认提权；
 * - 认证端点自带 20/min 限流，比 app.ts 的全局 100/min 更严，抵御暴力破解。
 */
export const auth = betterAuth({
  appName: 'Fullstack Template',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CORS_ORIGIN],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 每天续期一次
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    cookiePrefix: isProd ? 'app' : 'app_dev',
    useSecureCookies: isProd,
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: isProd,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      // 生产通过 env 指定管理员 user id（逗号分隔）；未设置时无人拥有管理员权限
      adminUserIds: env.ADMIN_USER_IDS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }),
  ],
});
