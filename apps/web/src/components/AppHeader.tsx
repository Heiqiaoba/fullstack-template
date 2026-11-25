import { signOut, useSession } from '@/lib/auth-client';
import { GithubOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

export function AppHeader() {
  const { data: session } = useSession();
  return (
    <Header className="flex items-center justify-between !bg-white !px-6 !shadow-sm">
      <Link to="/" className="flex items-center gap-2">
        <Title level={4} className="!m-0">
          Template App
        </Title>
      </Link>
      <Space>
        {session ? (
          <>
            <Text type="secondary">{session.user.email}</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => void signOut()}>
              退出
            </Button>
          </>
        ) : (
          <>
            <Button type="text" icon={<GithubOutlined />} />
            <Link to="/login">
              <Button type="primary">登录 / 注册</Button>
            </Link>
          </>
        )}
      </Space>
    </Header>
  );
}
