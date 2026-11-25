import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('auth routes', () => {
  it('GET /api/auth/get-session without cookie returns a session-less response', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/auth/get-session' });
    // better-auth 返回 200 + null session 或 401，取决于版本；两者均表示未登录
    expect([200, 401]).toContain(res.statusCode);
    await app.close();
  });

  it('protected user route rejects unauthenticated request with 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('protected todo route rejects unauthenticated request with 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/todos' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
