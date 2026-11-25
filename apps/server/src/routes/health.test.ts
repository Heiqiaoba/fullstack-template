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
