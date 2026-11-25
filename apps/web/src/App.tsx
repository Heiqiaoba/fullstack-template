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
