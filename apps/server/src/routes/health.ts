/**
 * 健康检查路由模块：提供 Liveness (/health) 与 Readiness (/ready) 两个探针。
 *
 * 依赖 db/index 执行 `select 1` 检测数据库连通性；由 app.ts 挂到 /api/v1 前缀下。
 * 两类探针都显式关闭限流——K8s/负载均衡会高频轮询，若被 429 会误判实例不健康。
 */
import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db';

/**
 * 注册健康检查路由。
 * Liveness 只看进程是否存活（不查依赖，避免数据库抖动导致容器被误重启）；
 * Readiness 才检查数据库，失败返回 503 让流量从该实例摘除。
 */
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
