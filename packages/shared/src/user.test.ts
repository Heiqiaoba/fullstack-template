import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, userSchema } from './user';

describe('user schemas', () => {
  it('accepts a valid user', () => {
    const result = userSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    expect(result.name).toBe('Alice');
  });

  it('rejects an invalid email', () => {
    expect(() =>
      registerSchema.parse({ name: 'Alice', email: 'not-an-email', password: 'password123' }),
    ).toThrow();
  });

  it('rejects a short password', () => {
    expect(() => loginSchema.parse({ email: 'alice@example.com', password: '' })).toThrow();
  });
});
