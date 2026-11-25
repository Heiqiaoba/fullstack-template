import { telemetry } from '@/lib/telemetry';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 无感采集路由变更：监听 location 变化上报 page_view。
 * 同时负责初始化 telemetry（定时器 / 卸载兜底）。
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
