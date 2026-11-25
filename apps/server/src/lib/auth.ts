import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env, isProd } from '../config/env';
import { db, schema } from '../db';

/**
 * Better Auth 实例：邮箱密码 + 数据库会话，Drizzle adapter 直连本项目连接池。
 * HTTP handler 在 app.ts 挂载到 /api/auth/*，前端用 better-auth/react 客户端调用。
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
});
