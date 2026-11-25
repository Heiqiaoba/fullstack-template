import { describe, expect, it } from 'vitest';
import { roleOf } from './role';

describe('roleOf', () => {
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
