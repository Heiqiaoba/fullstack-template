import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// 测试环境加载 .env.test，避免依赖真实数据库配置
config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
