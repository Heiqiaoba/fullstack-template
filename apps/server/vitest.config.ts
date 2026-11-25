/**
 * Vitest 测试配置：为 server 包提供 Node 测试环境。
 *
 * 关键设计决策：在加载配置时先读取 .env.test，使测试使用独立的环境变量，
 * 避免误连真实数据库或复用开发密钥；globals 开启以简洁写法使用 describe/it/expect；
 * coverage 由 COVERAGE=true 显式开启，默认不收集以加快日常测试速度。
 */
import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// 测试环境加载 .env.test，避免依赖真实数据库配置
config({ path: '.env.test' });

export default defineConfig({
  test: {
    coverage: {
      enabled: process.env.COVERAGE === 'true',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    environment: 'node',
    globals: true,
  },
});
