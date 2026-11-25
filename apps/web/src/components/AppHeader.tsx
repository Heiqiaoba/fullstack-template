import { GithubOutlined } from '@ant-design/icons';
import { Button, Layout, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

export function AppHeader() {
  return (
    <Header className="flex items-center justify-between !bg-white !px-6 !shadow-sm">
      <Link to="/" className="flex items-center gap-2">
        <Title level={4} className="!m-0">
          Template App
        </Title>
      </Link>
      <Space>
        <Button type="text" icon={<GithubOutlined />} />
        <Button type="primary">开始使用</Button>
      </Space>
    </Header>
  );
}
