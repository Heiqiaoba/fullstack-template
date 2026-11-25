/**
 * 健康检查路由测试：验证 Liveness/Readiness 与全局响应约定。
 *
 * 断言意义：
 * - /health 返回 ok 与数值型 uptime，保证探针基础字段稳定；
 * - 每个响应都带 x-request-id，确保请求追踪链路不因探针而缺失；
 * - /ready 在无数据库时允许 200 或 503，兼容测试环境有无数据库的两种情形；
 * - 未知路由返回 404，确认统一路由前缀与错误处理未误吞 NotFound。
 */
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('health routes', () => {
  it('GET /api/v1/health returns ok + uptime', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
    expect(typeof res.json().uptime).toBe('number');
    await app.close();
  });

  it('returns a request id header on every response', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.headers['x-request-id']).toBeTruthy();
    await app.close();
  });

  it('GET /api/v1/ready handles missing database gracefully', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/ready' });
    expect([200, 503]).toContain(res.statusCode);
    await app.close();
  });

  it('unknown route returns 404', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
