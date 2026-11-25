/**
 * 服务进程入口：启动 HTTP 监听并注册优雅关闭流程。
 *
 * 依赖 app.ts 构建应用、config/env 读取端口与地址、config/logger 输出启动日志、
 * db/index 关闭连接池。本模块只负责进程生命周期，不含任何业务逻辑，
 * 也不被其他模块导入（测试走 buildApp + inject，不经过这里）。
 */
import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { closeDb } from './db';

/** 启动服务并挂接 SIGTERM/SIGINT 信号处理；启动失败以非零码退出 */
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
  /** 幂等关闭处理：重复信号直接忽略，保证 app.close 与 closeDb 只执行一次 */
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
