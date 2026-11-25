import type { ErrorResponse } from '@template/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../lib/errors';

export function errorHandler(_error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  const error = _error as Error;

  if (error instanceof AppError) {
    const body: ErrorResponse = {
      error: { code: error.code, message: error.message, details: error.details },
    };
    return reply.status(error.statusCode).send(body);
  }

  if (error instanceof ZodError) {
    const body: ErrorResponse = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() },
    };
    return reply.status(400).send(body);
  }

  logger.error({ err: error, url: req.url }, 'Unhandled error');
  const body: ErrorResponse = {
    error: { code: 'INTERNAL', message: 'Internal server error' },
  };
  return reply.status(500).send(body);
}
