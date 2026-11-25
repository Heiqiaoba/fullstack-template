import { useUsers } from '@/api/users';
import { QueryState } from '@/components/QueryState';
import { authClient } from '@/lib/auth-client';
import {
  Alert,
  Button,
  Card,
  List,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';

const { Title, Paragraph } = Typography;

/**
 * 管理端示例页：演示「前端守卫 → adminClient API → 后端 admin 插件」完整链路。
 * 这是脚手架的参考实现，业务开发时可直接替换或复制到自己的管理模块。
 */
export function Admin() {
  const usersQuery = useUsers(1, 20);

  const setRole = async (userId: string, role: 'user' | 'admin') => {
    try {
      const result = await authClient.admin.setRole({ userId, role });
      if (result.error) message.error(result.error.message ?? '操作失败');
      else message.success(`已设置为 ${role}`);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Title level={2}>管理端示例</Title>
      <Paragraph type="secondary">
        本页受 AdminGuard 保护；数据来自 <code>GET /api/v1/users</code>（仅管理员）。
        角色管理直接调用 <code>authClient.admin.*</code>（Better Auth admin 插件），无需自行封装。
      </Paragraph>
      <Alert
        type="info"
        showIcon
        message="这是参考实现"
        description="脚手架只固化权限机制，不预置完整权限页面。实际项目请按自身角色体系替换本页。"
        style={{ marginBottom: 16 }}
      />
      <Card title="用户列表（管理员接口）">
        <QueryState query={usersQuery}>
          {(data) => (
            <Table
              rowKey="id"
              dataSource={data.items}
              pagination={{ current: 1, pageSize: 20, total: data.total }}
              columns={[
                { title: '昵称', dataIndex: 'name' },
                { title: '邮箱', dataIndex: 'email' },
                {
                  title: '角色',
                  dataIndex: 'role',
                  render: (role: string) => (
                    <Tag color={role === 'admin' ? 'gold' : 'default'}>{role}</Tag>
                  ),
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Space>
                      <Popconfirm
                        title="设为管理员？"
                        onConfirm={() => void setRole(record.id, 'admin')}
                      >
                        <Button size="small">设为管理员</Button>
                      </Popconfirm>
                      <Popconfirm
                        title="取消管理员？"
                        onConfirm={() => void setRole(record.id, 'user')}
                      >
                        <Button size="small">取消管理员</Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </QueryState>
      </Card>
    </div>
  );
}
