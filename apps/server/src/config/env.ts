/**
 * 全局环境配置模块：进程启动时一次性校验并解析 .env / process.env。
 *
 * 职责：作为所有模块读取配置的唯一入口，配合 Zod 在启动阶段做 fail-fast 校验，
 * 避免配置缺失或类型错误拖到请求运行时才暴露。被 logger、db、auth、app 等广泛依赖，
 * 本身不依赖任何业务模块（只依赖 dotenv 与 zod），位于依赖图的最底层。
 *
 * 特别处理：生产环境禁止使用开发用的默认签名密钥，直接从源头阻断不安全的部署。
 */
import 'dotenv/config';
import { z } from 'zod';

/**
 * 环境变量的 Zod 契约：默认值面向本地开发，必填项（DATABASE_URL）不设默认。
 * 字符串枚举在解析后 transform 成布尔/数字，让业务代码消费强类型配置。
 */
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

// 启动即失败：配置错误属于部署问题，运行时吞掉只会让故障更难定位。
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(z.flattenError(parsed.error), null, 2));
  throw new Error('Environment validation failed');
}

/** 已校验的强类型环境配置，全应用共享同一份快照 */
export const env = parsed.data;
/** 是否生产环境：控制安全 cookie、日志格式、文档开关等 */
export const isProd = env.NODE_ENV === 'production';
/** 是否测试环境：供采样、日志等做差异化处理 */
export const isTest = env.NODE_ENV === 'test';

// 生产环境强制校验签名密钥：默认值仅用于开发，上线必须替换，否则会话可被伪造。
if (isProd && env.BETTER_AUTH_SECRET === 'dev-secret-change-me') {
  throw new Error('BETTER_AUTH_SECRET must be set to a strong value in production');
}
