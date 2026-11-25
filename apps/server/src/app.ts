/**
 * Fastify 应用装配模块：唯一的 buildApp 工厂，组装插件、钩子、错误处理与业务路由。
 *
 * 依赖 config（env/logger）、lib/auth、middleware 与各 routes 模块；被 index.ts
 * 用于启动服务，也被所有测试通过 buildApp() + inject 注入请求，因此不在此处监听端口。
 *
 * 关键设计决策：Better Auth 的 Node handler 必须在 onRequest 钩子里 hijack
 * /api/auth/*，早于 Fastify 的 JSON body parser 接管原始请求——否则 body 流会被
 * parser 消费，Better Auth 读到 undefined。hijack 会绕过 onSend 链，故手动补 CORS
 * 与 x-request-id 响应头。全局限流与认证端点自身限流叠加，健康探针显式豁免。
 */
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { toNodeHandler } from 'better-auth/node';
import Fastify from 'fastify';
import { env, isProd } from './config/env';
import { logger, requestLogger } from './config/logger';
import { auth } from './lib/auth';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { telemetryRoutes } from './routes/telemetry';
import { todoRoutes } from './routes/todos';
import { userRoutes } from './routes/users';

/**
 * 构建并装配完整的 Fastify 实例（不监听端口）。
 *
 * 导出为工厂而非单例：测试可对每个用例创建隔离实例并用 inject 发请求，
 * 避免端口占用与全局状态串扰。装配顺序有意为之：安全/跨域/限流插件 →
 * Better Auth hijack → 文档 → 统一错误处理 → /api/v1 业务路由。
 *
 * @returns 已注册全部插件与路由、可直接 listen 或 inject 的 Fastify 实例
 */
export async function buildApp() {
  const app = Fastify({
    logger: isProd ? logger : false,
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  // 每个响应返回请求 ID，便于日志追踪与用户反馈；同时挂请求作用域 logger
  const startedAt = new WeakMap<object, number>();
  app.addHook('onRequest', async (req) => {
    req.log = requestLogger(req.id, req.method, req.url);
    startedAt.set(req.raw, Date.now());
  });
  app.addHook('onSend', async (req, reply, payload) => {
    reply.header('x-request-id', req.id);
    return payload;
  });
  // 结构化访问日志：字段稳定（requestId/method/path/status/duration），便于日志系统聚合。
  // 不记录 query（避免 token 等敏感参数入日志）。
  app.addHook('onResponse', async (req, reply) => {
    const start = startedAt.get(req.raw) ?? Date.now();
    req.log.info(
      {
        method: req.method,
        path: req.url.split('?')[0],
        status: reply.statusCode,
        durationMs: Date.now() - start,
      },
      'request completed',
    );
    startedAt.delete(req.raw);
  });

  // 安全 / 跨域 / 限流
  await app.register(helmet, {
    contentSecurityPolicy: isProd ? undefined : false,
  });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });
  // 全局限流 100/min；认证端点自身有更严的 20/min（见 lib/auth.ts），
  // 健康探针在路由上显式豁免（见 routes/health.ts）。
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (req) => ({
      error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后重试' },
      requestId: req.id,
    }),
  });

  // Better Auth：挂载到 /api/auth/*（必须在 JSON body parser 之前接管原始请求）
  // 原因：Fastify 默认 parser 会提前消费 body 流，Better Auth 将读到 undefined；
  // 用 onRequest + hijack 直接把 req.raw/res.raw 交给 Node handler 可保住原始 body。
  const authHandler = toNodeHandler(auth);
  app.addHook('onRequest', async (req, reply) => {
    if (req.url.startsWith('/api/auth/')) {
      // hijack 会绕过 Fastify 的 onSend 链，手动补上 CORS 与 x-request-id 响应头
      const origin = req.headers.origin;
      if (
        origin &&
        env.CORS_ORIGIN.split(',')
          .map((s) => s.trim())
          .includes(origin)
      ) {
        reply.raw.setHeader('access-control-allow-origin', origin);
        reply.raw.setHeader('access-control-allow-credentials', 'true');
        reply.raw.setHeader('vary', 'origin');
      }
      reply.raw.setHeader('x-request-id', req.id);
      reply.hijack();
      await authHandler(req.raw, reply.raw);
    }
  });

  // API 文档（生产默认关闭；开启时用 Bearer Token 简单保护）
  if (env.ENABLE_DOCS) {
    await app.register(swagger, {
      openapi: {
        info: { title: 'Template API', version: '0.1.0' },
        servers: [{ url: env.BETTER_AUTH_URL }],
        components: {
          securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'app_session_token' },
          },
        },
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list' },
    });
    if (env.DOCS_TOKEN) {
      app.addHook('onRequest', async (req, reply) => {
        if (
          req.url.startsWith('/docs') &&
          req.headers.authorization !== `Bearer ${env.DOCS_TOKEN}`
        ) {
          await reply
            .status(401)
            .send({ error: { code: 'UNAUTHORIZED', message: 'Docs access denied' } });
        }
      });
    }
  }

  // 统一错误处理
  app.setErrorHandler(errorHandler);

  // 业务路由统一挂到 /api/v1
  await app.register(
    async (api) => {
      await healthRoutes(api);
      await userRoutes(api);
      await todoRoutes(api);
      await telemetryRoutes(api);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
