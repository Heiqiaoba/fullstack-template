/**
 * Drizzle Kit 配置：定义迁移文件的生成来源与输出位置。
 *
 * schema 指向 src/db/schema.ts（聚合了业务表与 Better Auth 认证表），
 * out 指向 ./drizzle，dbCredentials 取 DATABASE_URL 供 kit 连接数据库做迁移比对。
 * 运行方式：pnpm --filter @template/server exec drizzle-kit generate / migrate；
 * strict 与 verbose 开启，让 schema 变更检查更严格、输出更详细。
 */
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
