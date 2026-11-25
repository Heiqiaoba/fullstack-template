/**
 * roleOf 纯函数单元测试：验证从 session 中提取角色的三条路径——
 * 已知角色（admin/user）命中、缺失 session 或未知角色一律返回 undefined。
 */
import { describe, expect, it } from 'vitest';
import { roleOf } from './role';

describe('roleOf', () => {
  // 白名单策略：只有显式的 'admin'/'user' 才被认可，避免意外角色进入前端门禁。
  it('extracts admin role from session', () => {
    expect(roleOf({ user: { role: 'admin' } })).toBe('admin');
  });

  it('extracts normal user role', () => {
    expect(roleOf({ user: { role: 'user' } })).toBe('user');
  });

  it('returns undefined for missing session or unknown role', () => {
    expect(roleOf(null)).toBeUndefined();
    expect(roleOf(undefined)).toBeUndefined();
    expect(roleOf({ user: {} })).toBeUndefined();
    expect(roleOf({ user: { role: 'superadmin' } })).toBeUndefined();
  });
});
