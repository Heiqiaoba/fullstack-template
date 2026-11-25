/**
 * 埋点初始化与路由采集组件（无 UI 输出）。
 *
 * 架构位置：在 main.tsx 中挂载于 BrowserRouter 内，因为需要 useLocation 监听路由变化：
 * - 挂载时调用 telemetry.init() 启动定时批量上报与页面卸载兜底；
 * - 路由 pathname 变化时上报 page_view；
 * - 卸载时 destroy()，配合 StrictMode 双挂载不会残留定时器。
 */
import { telemetry } from '@/lib/telemetry';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 初始化采集器并自动上报路由切换；组件本身不渲染任何内容。
 */
export function TelemetryBootstrap() {
  const location = useLocation();
  useEffect(() => {
    telemetry.init();
    return () => telemetry.destroy();
  }, []);
  useEffect(() => {
    telemetry.track('page_view', { path: location.pathname });
  }, [location.pathname]);
  return null;
}
