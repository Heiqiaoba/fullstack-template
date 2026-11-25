import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('telemetry ingest', () => {
  it('accepts a batch of valid events anonymously with 202', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/telemetry',
      payload: {
        events: [
          {
            type: 'page_view',
            timestamp: new Date().toISOString(),
            path: '/todos',
            sessionId: 'anon-session-1',
            props: { source: 'spa' },
          },
        ],
      },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ accepted: 1 });
    await app.close();
  });

  it('rejects malformed events with 400', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/telemetry',
      payload: { events: [{ type: '' }] },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
