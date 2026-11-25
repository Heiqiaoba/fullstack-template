import { AppHeader } from '@/components/AppHeader';
import { Home } from '@/routes/Home';
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
            <Route path="/" element={<Home />} />
          </Routes>
        </Content>
        <Footer className="!bg-transparent !text-center">
          Fullstack Template © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
