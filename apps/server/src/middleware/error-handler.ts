import type { ErrorResponse } from '@template/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError, flattenError } from 'zod';
import { AppError } from '../lib/errors';

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
