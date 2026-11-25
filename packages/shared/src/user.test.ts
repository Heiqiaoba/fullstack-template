/**
 * 用户契约 schema 的单测：验证「合法形状被接受、非法输入被拒绝」。
 * 这里是共享规则的守护测试，schema 变更时首先要同步这里。
 */
import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, userSchema } from './user';

describe('user schemas', () => {
  /** 正常用户对象应通过解析，角色为合法枚举值 */
  it('accepts a valid user', () => {
    const result = userSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    expect(result.name).toBe('Alice');
  });

  /** 邮箱格式非法时注册应失败 */
  it('rejects an invalid email', () => {
    expect(() =>
      registerSchema.parse({ name: 'Alice', email: 'not-an-email', password: 'password123' }),
    ).toThrow();
  });

  /** 登录时空密码应被拒绝（loginSchema 要求非空） */
  it('rejects a short password', () => {
    expect(() => loginSchema.parse({ email: 'alice@example.com', password: '' })).toThrow();
  });
});
