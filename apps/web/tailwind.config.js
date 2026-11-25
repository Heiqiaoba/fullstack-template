/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    // 关闭 Preflight，避免重置掉 Ant Design 的按钮/表单/边框等基础样式
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f4ff',
          500: '#1677ff',
          600: '#0958d9',
        },
      },
    },
  },
  plugins: [],
};
