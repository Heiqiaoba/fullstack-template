import pino from 'pino';
import { env, isProd } from './env';

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token'],
    censor: '[REDACTED]',
  },
});
