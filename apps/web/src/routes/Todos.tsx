import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/api/todos';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  List,
  Pagination,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

const { Title } = Typography;

export function Todos() {
  const [page, setPage] = useState(1);
  const [form] = Form.useForm<{ title: string }>();
  const { data, isLoading, error } = useTodos(page, 10);
  const create = useCreateTodo();
  const update = useUpdateTodo();
  const remove = useDeleteTodo();

  const onAdd = async (values: { title: string }) => {
    try {
      await create.mutateAsync(values);
      form.resetFields();
      message.success('已添加');
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Title level={2}>我的待办</Title>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={onAdd}>
          <Form.Item
            name="title"
            rules={[{ required: true, message: '请输入内容' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="添加一个待办…" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={create.isPending}>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        {error && <Typography.Text type="danger">{(error as Error).message}</Typography.Text>}
        {isLoading ? (
          <Spin />
        ) : (
          <>
            <List
              dataSource={data?.items ?? []}
              locale={{ emptyText: '暂无待办' }}
              renderItem={(todo) => (
                <List.Item
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      danger
                      size="small"
                      loading={remove.isPending}
                      onClick={() => remove.mutate(todo.id)}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <Space>
                    <Checkbox
                      checked={todo.completed}
                      onChange={(e) => update.mutate({ id: todo.id, completed: e.target.checked })}
                    />
                    <span style={{ textDecoration: todo.completed ? 'line-through' : undefined }}>
                      {todo.title}
                    </span>
                  </Space>
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
