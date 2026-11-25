import { signIn, signUp } from '@/lib/auth-client';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

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
