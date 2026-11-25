/**
 * 登录/注册页（公开路由，无需守卫）。
 *
 * 架构位置：App.tsx 中 `/login` 路由对应的页面，使用 lib/auth-client 的 signIn/signUp
 * 完成邮件密码认证；登录成功后跳转到 location.state.from（由 AuthGuard 或 ApiAuthSync 写入），
 * 没有来源时回首页，形成「被守卫拦截 → 登录 → 回到原页」的完整体验闭环。
 */
import { signIn, signUp } from '@/lib/auth-client';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

/**
 * 登录/注册组件：两种模式共用一张表单，注册模式额外要求昵称字段。
 * @returns 登录页 JSX
 */
export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  /**
   * 表单提交：按当前模式调用 signIn.email 或 signUp.email；
   * 认证成功后 navigate(from, { replace: true }) 回到来源页，失败则展示错误信息。
   * @param values 表单值（邮箱、密码、注册时的昵称）
   */
  const onFinish = async (values: { email: string; password: string; name?: string }) => {
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await signIn.email({ email: values.email, password: values.password })
          : await signUp.email({
              email: values.email,
              password: values.password,
              name: values.name ?? '',
            });
      if (result.error) {
        setError(result.error.message ?? '操作失败');
        return;
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '75vh', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3}>{mode === 'login' ? '登录' : '注册'}</Title>
        <Paragraph type="secondary">
          {mode === 'login' ? '登录后查看你的待办事项' : '创建一个账号开始使用'}
        </Paragraph>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          {mode === 'register' && (
            <Form.Item label="昵称" name="name" rules={[{ required: true, min: 2 }]}>
              <Input placeholder="你的昵称" />
            </Form.Item>
          )}
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, min: 8, message: '密码至少 8 位' }]}
          >
            <Input.Password placeholder="至少 8 位" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {mode === 'login' ? '登录' : '注册'}
          </Button>
        </Form>
        <Button
          type="link"
          block
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
        </Button>
      </Card>
    </div>
  );
}
