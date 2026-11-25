/**
 * 日志模块：全局 Pino logger + 请求作用域子 logger 工厂。
 *
 * 依赖 config/env 决定级别与输出格式；被 app.ts（请求钩子）、telemetry-sink、
 * index.ts（启动/关闭日志）使用。通过 redact 在日志层统一脱敏凭证，
 * 并去掉 URL query，防止 token 等敏感参数随访问日志泄漏。
 */
import pino, { type Logger } from 'pino';
import { env, isProd } from './env';

/**
 * 全局 logger：生产输出 JSON 便于日志系统采集，开发用 pino-pretty 便于阅读。
 * redact 列表覆盖认证头、cookie、密码哈希与令牌，作为敏感信息防泄漏的最后一道闸。
 */
export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token'],
    censor: '[REDACTED]',
  },
});

/**
 * 创建请求作用域 logger：把 requestId、method、path 绑定为子 logger 的固定字段，
 * 使同一请求的所有日志可串联；path 去掉 query 以避免敏感参数入日志。
 *
 * @param requestId 请求唯一 ID，与响应头 x-request-id 对应
 * @param method HTTP 方法
 * @param url 完整请求 URL（仅保留路径部分写入日志）
 * @returns 带绑定字段的 Pino 子 logger
 */
export function requestLogger(requestId: string, method: string, url: string): Logger {
  return logger.child({ requestId, method, path: url.split('?')[0] });
}
