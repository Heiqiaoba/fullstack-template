import type { FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { Errors } from '../lib/errors';

/** 用共享的 Zod schema 校验请求体，前后端规则完全一致 */
export function parseBody<T extends z.ZodTypeAny>(schema: T, req: FastifyRequest): z.infer<T> {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw Errors.badRequest('Invalid request body', result.error.flatten());
  }
  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, req: FastifyRequest): z.infer<T> {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw Errors.badRequest('Invalid query parameters', result.error.flatten());
  }
  return result.data;
}
