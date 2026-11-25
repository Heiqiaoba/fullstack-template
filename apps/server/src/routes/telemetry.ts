import { telemetryBatchSchema } from '@template/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { resolveSession } from '../lib/context';
import { writeTelemetry } from '../lib/telemetry-sink';
import { parseBody } from '../middleware/validation';

/**
 * 埋点接收端点：
 * - 无认证要求（未登录用户的 page_view 也要采集），用户无感
 * - 从 cookie 静默解析 userId（有则带上，无则匿名），不额外要求鉴权
 * - 限流豁免由全局 rate-limit 的 allowList / 路由配置控制（见 app.ts）
 */
export async function telemetryRoutes(app: FastifyInstance) {
  app.post(
    '/telemetry',
    {
      config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
      schema: { tags: ['telemetry'], summary: '批量接收前端埋点事件' },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { events } = parseBody(telemetryBatchSchema, req);
      // 静默补全用户身份：不强制登录，不抛错
      const session = await resolveSession(req).catch(() => null);
      const enriched = events.map((e) => ({
        ...e,
        userId: e.userId ?? session?.userId,
      }));
      await writeTelemetry(enriched);
      return reply.status(202).send({ accepted: enriched.length });
    },
  );
}
