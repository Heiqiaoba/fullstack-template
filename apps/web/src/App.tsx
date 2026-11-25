/**
 * 应用根组件：定义整体布局与路由表。
 *
 * 架构位置：由 main.tsx 的 Root 挂载于 BrowserRouter / QueryClientProvider / ErrorBoundary 内。
 *
 * 路由结构与守卫嵌套：
 * - `/login`：公开路由，无需守卫；
 * - `/`（首页）、`/todos`：用 AuthGuard 包裹，未登录跳登录页并带回跳来源；
 * - `/admin`：用 AdminGuard 包裹（内部再组合 AuthGuard + RoleGate），要求登录且为 admin；
 * - `*`：NotFound 兜底 404。
 * 守卫均为客户端体验层，真正安全边界在后端受保护接口。
 * 主题与语言：ConfigProvider 注入 antd 中文 locale 与统一主题 token。
 */
import { AdminGuard } from '@/components/AdminGuard';
import { AppHeader } from '@/components/AppHeader';
import { AuthGuard } from '@/components/AuthGuard';
import { Admin } from '@/routes/Admin';
import { Home } from '@/routes/Home';
import { Login } from '@/routes/Login';
import { NotFound } from '@/routes/NotFound';
import { Todos } from '@/routes/Todos';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Route, Routes } from 'react-router-dom';

const { Content, Footer } = Layout;

/**
 * 根组件：渲染 Layout（Header + 路由内容 + Footer）与路由表。
 * @returns 应用根 JSX
 */
export function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <Layout className="min-h-screen">
        <AppHeader />
        <Content className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Home />
                </AuthGuard>
              }
            />
            <Route
              path="/todos"
              element={
                <AuthGuard>
                  <Todos />
                </AuthGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <Admin />
                </AdminGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Content>
        <Footer className="!bg-transparent !text-center">
          Fullstack Template © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
