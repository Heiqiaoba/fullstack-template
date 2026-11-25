/**
 * 应用首页（受 AuthGuard 保护）：展示前后端连通示例。
 *
 * 架构位置：App.tsx 中 `/` 路由对应的页面，通过 api/users 的 useUsers 拉取受保护的用户列表，
 * 并用 QueryState 统一处理四态；分页状态由本地 useState 维护。
 */
import { useUsers } from '@/api/users';
import { QueryState } from '@/components/QueryState';
import { signOut } from '@/lib/auth-client';
import { Button, Card, List, Pagination, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

/**
 * 首页组件：分页展示用户列表，并提供进入待办页与退出登录入口。
 * @returns 首页 JSX
 */
export function Home() {
  const [page, setPage] = useState(1);
  const query = useUsers(page, 10);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <Title level={2}>前后端已连通 🎉</Title>
      <Paragraph type="secondary">
        Vite + React + Fastify + Drizzle + Better Auth。用户列表来自受保护的 /api/v1/users。
      </Paragraph>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/todos">
          <Button type="primary">我的待办</Button>
        </Link>
        <Button onClick={() => void signOut()}>退出登录</Button>
      </div>
      <Card title="用户列表" style={{ marginTop: 16 }}>
        <QueryState query={query}>
          {(data) => (
            <>
              <List
                dataSource={data.items}
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
                total={data.total}
                onChange={setPage}
              />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
}
