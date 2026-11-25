/**
 * 请求校验工具：用 @template/shared 的 Zod schema 校验请求各部分的辅助函数。
 *
 * 依赖 lib/errors 抛出带字段级 details 的 400 业务错误，最终由 error-handler
 * 转成统一响应；被 routes/users 与 routes/todos 调用。之所以在路由里显式调用
 * parseXxx（而非依赖 Fastify schema），是为了让运行时校验与共享类型契约保持同源：
 * 前后端使用同一个 schema，规则改一处即同时生效。
 */
import type { FastifyRequest } from 'fastify';
import { flattenError, type z } from 'zod';
import { Errors } from '../lib/errors';

/**
 * 校验请求体，校验失败抛 400 BAD_REQUEST（details 为字段级错误）。
 *
 * @param schema 共享 Zod schema
 * @param req 当前请求
 * @returns 经 schema 解析、类型收窄后的 body
 */
export function parseBody<T extends z.ZodTypeAny>(schema: T, req: FastifyRequest): z.infer<T> {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw Errors.badRequest('Invalid request body', flattenError(result.error));
  }
  return result.data;
}

/** 校验查询参数（querystring），失败抛 400 BAD_REQUEST */
export function parseQuery<T extends z.ZodTypeAny>(schema: T, req: FastifyRequest): z.infer<T> {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw Errors.badRequest('Invalid query parameters', flattenError(result.error));
  }
  return result.data;
}

/** 校验路径参数（params），失败抛 400 BAD_REQUEST */
export function parseParams<T extends z.ZodTypeAny>(schema: T, req: FastifyRequest): z.infer<T> {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw Errors.badRequest('Invalid path parameters', flattenError(result.error));
  }
  return result.data;
}
