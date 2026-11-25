import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db';

/** Liveness：只看进程活着 */
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', { config: { rateLimit: false } }, async () => ({
    status: 'ok',
    uptime: process.uptime(),
  }));

  /** Readiness：检查数据库连通性，供 K8s / 负载均衡使用；探针高频调用，豁免限流 */
  app.get('/ready', { config: { rateLimit: false } }, async (_req, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch {
      return reply.status(503).send({ status: 'unavailable', reason: 'database' });
    }
  });
}
