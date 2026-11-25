import pino, { type Logger } from 'pino';
import { env, isProd } from './env';

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token'],
    censor: '[REDACTED]',
  },
});

/** 请求作用域 logger：携带 requestId 与脱敏后的路径（去掉 query，避免敏感参数入日志） */
export function requestLogger(requestId: string, method: string, url: string): Logger {
  return logger.child({ requestId, method, path: url.split('?')[0] });
}
