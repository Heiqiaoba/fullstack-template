/**
 * Vitest 全局测试初始化（由 vitest.config.ts 的 setupFiles 指定）。
 *
 * 职责：
 * - 引入 @testing-library/jest-dom/vitest，让 expect(...).toBeInTheDocument() 等 DOM 断言可用；
 * - 为 jsdom 补齐缺失的 window.matchMedia API（antd 响应式组件初始化时需要）。
 */
import '@testing-library/jest-dom/vitest';

// jsdom 未提供 matchMedia，antd 的响应式组件需要它
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
