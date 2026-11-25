/**
 * Vitest 单元测试配置（与 vite.config.ts 共享别名与 React 插件）。
 *
 * 要点：
 * - environment=jsdom：提供浏览器 DOM API 以渲染 React 组件；
 * - globals=true：测试中可直接使用 describe/it/expect 而无需逐个 import；
 * - setupFiles：加载 src/test/setup.ts（jest-dom 断言 + matchMedia 补齐）；
 * - coverage：仅当 COVERAGE=true 时开启，输出 text + lcov，覆盖 src 下的 TS/TSX。
 */
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    coverage: {
      enabled: process.env.COVERAGE === 'true',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
