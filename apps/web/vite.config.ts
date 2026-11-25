/**
 * Vite 构建与开发服务器配置。
 *
 * 要点：
 * - React 插件提供 JSX 转换与 Fast Refresh；
 * - `@` 别名指向 src，与 TS 路径别名及 vitest 配置保持一致；
 * - 开发服务器把 /api 代理到本机 3000 端口后端（统一同源，避免 CORS 与 Cookie 问题）；
 * - 构建时按 react / antd / query / auth 拆分手动 chunk，优化首屏与缓存命中。
 */
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          query: ['@tanstack/react-query', 'axios'],
          auth: ['better-auth/react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
