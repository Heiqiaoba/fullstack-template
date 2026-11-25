import { useUsers } from '@/api/users';
import { signOut } from '@/lib/auth-client';
import { Alert, Button, Card, List, Pagination, Spin, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export function Home() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useUsers(page, 10);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <Title level={2}>前后端已连通 🎉</Title>
      <Paragraph type="secondary">
        Vite + React + Fastify + Drizzle + Better Auth。用户列表来自受保护的 /api/v1/users。
      </Paragraph>
      <SpaceButtons />
      <Card title="用户列表" style={{ marginTop: 16 }}>
        {error && <Alert type="error" message={(error as Error).message} />}
        {isLoading ? (
          <Spin />
        ) : (
          <>
            <List
              dataSource={data?.items ?? []}
              locale={{ emptyText: '暂无用户' }}
              renderItem={(user) => (
                <List.Item>
                  <List.Item.Meta title={user.name} description={user.email} />
                </List.Item>
              )}
            />
            <Pagination
              style={{ marginTop: 16, textAlign: 'right' }}
              current={page}
              pageSize={10}
              total={data?.total ?? 0}
              onChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function SpaceButtons() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Link to="/todos">
        <Button type="primary">我的待办</Button>
      </Link>
      <Button onClick={() => void signOut()}>退出登录</Button>
    </div>
  );
}
