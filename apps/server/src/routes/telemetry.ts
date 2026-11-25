/**
 * 埋点接收路由模块：单条 POST /telemetry，批量接收前端事件。
 *
 * 依赖 lib/context 的 resolveSession 静默补全用户身份、lib/telemetry-sink 落地事件、
 * middleware/validation 校验批次格式；由 app.ts 挂到 /api/v1 前缀。
 *
 * 关键设计决策：
 * - 无认证要求（未登录用户的 page_view 也要采集），用户无感；
 * - 从 cookie 静默解析 userId（有则带上，无则匿名），解析异常一律吞掉，不因埋点影响业务；
 * - 路由配置 200/min 的独立限流（高于全局 100/min），既防刷又不误伤正常上报；
 * - 立即返回 202 Accepted，落地耗时不阻塞客户端。
 */
import { telemetryBatchSchema } from '@template/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { resolveSession } from '../lib/context';
import { writeTelemetry } from '../lib/telemetry-sink';
import { parseBody } from '../middleware/validation';

/** 注册埋点接收端点 */
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
