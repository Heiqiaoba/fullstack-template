/**
 * 全局错误上报 hook：把未捕获的运行时错误与 Promise 拒绝转成埋点事件。
 *
 * 架构位置：在 main.tsx 的 Root 组件中调用，监听 window 级 'error' 与 'unhandledrejection'，
 * 与 ErrorBoundary（渲染期错误 UI）互补：这里负责采集，ErrorBoundary 负责展示与恢复。
 * 返回时清理监听器，避免 StrictMode 双挂载造成重复上报。
 */
import { useEffect } from 'react';
import { telemetry } from './telemetry';

/**
 * 注册全局错误监听并在组件卸载时清理。
 * @returns 无返回值（副作用型 hook）
 */
export function useTelemetryErrors() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      telemetry.track('js_error', {
        message: e.message.slice(0, 300),
        filename: e.filename?.slice(0, 200) ?? '',
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      telemetry.track('unhandled_rejection', {
        message: (reason instanceof Error ? reason.message : String(reason)).slice(0, 300),
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
}
