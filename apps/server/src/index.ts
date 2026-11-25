import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { closeDb } from './db';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Server listening on ${env.HOST}:${env.PORT}`);
    logger.info(`API base: ${env.BETTER_AUTH_URL}/api/v1`);
    if (env.ENABLE_DOCS) logger.info(`API docs at ${env.BETTER_AUTH_URL}/docs`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }

  // 优雅关闭：停止接收新请求 → 关闭 DB 连接池
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    try {
      await app.close();
      await closeDb();
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
