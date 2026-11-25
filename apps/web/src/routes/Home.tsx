import { useUsers } from '@/api/users';
import { Alert, Card, List, Spin, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export function Home() {
  const { data, isLoading, error } = useUsers();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Title level={2}>前后端已连通 🎉</Title>
      <Paragraph type="secondary">
        这是 Vite + React + TS + Tailwind + Ant Design + TanStack Query + Fastify + Drizzle 的起点。
      </Paragraph>

      <Card title="用户列表（来自后端 /api/users）" className="mt-6">
        {error && <Alert type="error" message={(error as Error).message} />}
        {isLoading ? (
          <Spin />
        ) : (
          <List
            dataSource={data ?? []}
            locale={{ emptyText: '暂无数据，先运行 pnpm db:seed 填充' }}
            renderItem={(user) => (
              <List.Item>
                <List.Item.Meta title={user.name} description={user.email} />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
