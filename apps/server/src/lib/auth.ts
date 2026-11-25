import { env } from '../config/env';

/**
 * 认证占位（接入点已留好）。
 *
 * 推荐在正式写业务前接入 better-auth：
 *   1. 安装 @better-auth/drizzle-adapter（或 better-auth 的 drizzle 集成）
 *   2. 传入本项目的 drizzle 实例与 schema
 *   3. 在 app.ts 挂载 auth.handler 到 /api/auth/*
 *
 * 这样现在脚手架可编译可运行，后期接入认证不需要改路由结构。
 */
export const authConfig = {
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
} as const;
