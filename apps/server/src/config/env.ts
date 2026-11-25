import 'dotenv/config';
import { z } from 'zod';

/** 启动时校验环境变量，配置缺失立即失败而不是运行到一半崩溃 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  BETTER_AUTH_SECRET: z.string().min(1).default('dev-secret-change-me'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
  /** 管理员用户 ID（逗号分隔），对应 admin 插件的 adminUserIds */
  ADMIN_USER_IDS: z.string().default(''),
  /** 是否注册 Swagger UI：生产默认关闭，除非显式开启 */
  ENABLE_DOCS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  /** 文档访问密钥（简单保护，生产建议前置网关） */
  DOCS_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(z.flattenError(parsed.error), null, 2));
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (isProd && env.BETTER_AUTH_SECRET === 'dev-secret-change-me') {
  throw new Error('BETTER_AUTH_SECRET must be set to a strong value in production');
}
