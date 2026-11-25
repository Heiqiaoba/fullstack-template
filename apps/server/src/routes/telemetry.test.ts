/**
 * 埋点接收端点测试：验证匿名批量上报与请求校验。
 *
 * 断言意义：
 * - 合法事件批次无需登录即返回 202 与 accepted 数量，证明埋点路径保持用户无感；
 * - 缺少必填字段的事件被 Zod 校验拦截返回 400，确认共享契约在服务端真实生效，
 *   而非只做文档展示。
 */
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
