/**
 * 全局应用头部组件：展示品牌入口，并根据会话状态渲染不同的操作区。
 *
 * 架构位置：由 App.tsx 置于 Layout 顶部，所有路由共享；
 * 登录态下显示管理员入口（仅 admin 角色）、邮箱与退出按钮，未登录时显示登录/注册入口。
 * 角色判断仅控制展示，不构成安全边界。
 */
import { signOut, useSession } from '@/lib/auth-client';
import { GithubOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

/**
 * 根据 useSession 的会话数据条件渲染头部操作区。
 * @returns 顶部导航栏 JSX
 */
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
            {(session.user as { role?: string }).role === 'admin' && (
              <Link to="/admin">
                <Button type="text">管理端</Button>
              </Link>
            )}
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
