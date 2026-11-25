import { useEffect } from 'react';
import { telemetry } from './telemetry';

/** 全局错误上报：把未捕获的渲染/运行时错误转成埋点事件 */
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
