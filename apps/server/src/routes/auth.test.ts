/**
 * 认证与鉴权集成测试：通过 buildApp + inject 验证 Better Auth hijack、守卫与限流配置。
 *
 * 重点断言的意义：
 * - 未登录会话响应允许 200(null session) 或 401，兼容 better-auth 版本差异；
 * - POST body 必须被 better-auth 正确读取（字段级 password 校验错误），
 *   以证明 onRequest hijack 早于 Fastify JSON parser 消费 body 流；
 * - hijack 绕过 onSend 链，需断言手动补齐的 CORS 与 x-request-id 响应头；
 * - protected 路由 401 与管理员列表 401 验证守卫生效，健康探针多次调用无 429
 *   验证限流豁免配置。
 */
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

  it('forwards POST body to better-auth handler (not consumed by Fastify parser)', async () => {
    const app = await buildApp();
    // 缺 password 时必须由 better-auth 返回字段级校验错误（证明 body 被正确读取），
    // 而不是 "expected object, received undefined"（body 丢失）
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'test@example.com' },
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('body.password');
    await app.close();
  });

  it('adds CORS headers to hijacked auth responses', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['x-request-id']).toBeTruthy();
    await app.close();
  });

  it('admin-only user list rejects unauthenticated request with 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('health probes are exempt from rate limiting (no 429 under repeated calls)', async () => {
    const app = await buildApp();
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
      expect(res.statusCode).toBe(200);
    }
    await app.close();
  });

  it('protected todo route rejects unauthenticated request with 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/todos' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
