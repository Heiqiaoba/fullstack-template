/**
 * 全局错误处理中间件：把所有异常归一成共享契约的 ErrorResponse 响应。
 *
 * 依赖 lib/errors 识别 AppError、Zod 处理参数校验错误、config/logger 所在的
 * req.log 记录未知错误；由 app.ts 通过 setErrorHandler 注册。
 * 分层策略：已知业务错误按自身状态码/code 返回；ZodError 统一 400；
 * 未知错误只记录服务端日志并返回泛化 500，避免向客户端泄露内部细节。
 */
import type { ErrorResponse } from '@template/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError, flattenError } from 'zod';
import { AppError } from '../lib/errors';

/**
 * Fastify 全局错误处理器：按错误类型分派响应，所有分支都附带 requestId 便于追踪。
 * 未知异常只在服务端记录完整堆栈，客户端永远收到相同的泛化消息。
 */
export function errorHandler(_error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  const error = _error as Error;
  const requestId = req.id;

  if (error instanceof AppError) {
    const body: ErrorResponse = {
      error: { code: error.code, message: error.message, details: error.details },
      requestId,
    };
    return reply.status(error.statusCode).send(body);
  }

  if (error instanceof ZodError) {
    const body: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: flattenError(error),
      },
      requestId,
    };
    return reply.status(400).send(body);
  }

  req.log.error({ err: error, requestId, path: req.url.split('?')[0] }, 'Unhandled error');
  const body: ErrorResponse = {
    error: { code: 'INTERNAL', message: 'Internal server error' },
    requestId,
  };
  return reply.status(500).send(body);
}
