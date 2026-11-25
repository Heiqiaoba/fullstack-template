/**
 * 待办页面（受 AuthGuard 保护）：演示 TanStack Query 的完整 CRUD 交互。
 *
 * 架构位置：App.tsx 中 `/todos` 路由对应的页面，所有数据操作都通过 api/todos 的 hooks 完成：
 * 查询列表、新建、勾选完成（乐观更新）、删除，并用 QueryState 统一渲染四态。
 */
import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/api/todos';
import { QueryState } from '@/components/QueryState';
import { Button, Card, Checkbox, Form, Input, List, Pagination, Typography, message } from 'antd';
import { useState } from 'react';

const { Title } = Typography;

/**
 * 待办页组件：表单新建 + 列表勾选/删除 + 分页。
 * @returns 待办页 JSX
 */
export function Todos() {
  const [page, setPage] = useState(1);
  const [form] = Form.useForm<{ title: string }>();
  const query = useTodos(page, 10);
  const create = useCreateTodo();
  const update = useUpdateTodo();
  const remove = useDeleteTodo();

  /**
   * 提交新建待办：成功后重置表单并提示，失败时展示 ApiError 的消息。
   * @param values 表单值（title）
   */
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
        <QueryState query={query} empty={<>暂无待办</>}>
          {(data) => (
            <>
              <List
                dataSource={data.items}
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
                    <Checkbox
                      checked={todo.completed}
                      onChange={(e) => update.mutate({ id: todo.id, completed: e.target.checked })}
                    />
                    <span style={{ textDecoration: todo.completed ? 'line-through' : undefined }}>
                      {todo.title}
                    </span>
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
