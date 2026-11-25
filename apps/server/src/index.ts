import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on http://localhost:${env.PORT}`);
    logger.info(`API docs at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
