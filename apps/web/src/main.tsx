/**
 * 应用入口：查找 #root 挂载点，构建 Provider 树并渲染 Root。
 *
 * Provider 层级（由外到内，顺序有意为之）：
 * 1. StrictMode —— 开发期暴露副作用问题；
 * 2. ErrorBoundary —— 必须最外层，才能捕获其内部所有组件的渲染异常；
 * 3. QueryClientProvider —— 为数据 hooks 提供全局查询缓存；
 * 4. BrowserRouter —— 提供路由上下文（其内组件才能用 useNavigate/useLocation）；
 * 5. TelemetryBootstrap / ApiAuthSync / App —— 前两者是依赖路由上下文的无 UI 组件，
 *    分别负责埋点初始化与 401 事件总线接线，最后才是业务根组件 App。
 * 此外 Root 调用 useTelemetryErrors 注册全局错误采集，与 ErrorBoundary 形成互补。
 */
import { queryClient } from '@/lib/queryClient';
import { useTelemetryErrors } from '@/lib/useTelemetryErrors';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ApiAuthSync } from './components/ApiAuthSync';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TelemetryBootstrap } from './components/TelemetryBootstrap';
import './styles/index.css';
import './styles/antd-overrides.less';

const rootEl = document.getElementById('root');
// 挂载点是应用启动的硬前提，缺失时直接抛出，避免后续 createRoot 报更晦涩的错误。
if (!rootEl) throw new Error('Root element #root not found');

/**
 * 应用根组件：注册全局错误上报，并组装 Provider 层级（见文件头说明）。
 * @returns Provider 树 JSX
 */
function Root() {
  useTelemetryErrors();
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TelemetryBootstrap />
            <ApiAuthSync />
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

createRoot(rootEl).render(<Root />);
