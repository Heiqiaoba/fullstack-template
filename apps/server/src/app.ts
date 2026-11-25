import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { env, isProd } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { userRoutes } from './routes/users';

/** 构建 Fastify 实例（导出以便测试用 supertest 注入） */
export async function buildApp() {
  const app = Fastify({
    logger: isProd ? logger : false,
    trustProxy: true,
  });

  // 安全 / 跨域 / 限流
  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // API 文档（OpenAPI）
  await app.register(swagger, {
    openapi: {
      info: { title: 'Template API', version: '0.1.0' },
      servers: [{ url: `http://localhost:${env.PORT}` }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // 统一错误处理
  app.setErrorHandler(errorHandler);

  // 路由（统一挂到 /api）
  await app.register(
    async (api) => {
      await healthRoutes(api);
      await userRoutes(api);
    },
    { prefix: '/api' },
  );

  return app;
}
