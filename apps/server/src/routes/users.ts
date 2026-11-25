import {
  errorResponseSchema,
  idParamSchema,
  paginatedSchema,
  paginationSchema,
  userSchema,
} from '@template/shared';
import type { FastifyInstance } from 'fastify';
import { getAuth, requireAuth } from '../lib/context';
import { Errors } from '../lib/errors';
import { toJsonSchema } from '../lib/json-schema';
import { parseParams, parseQuery } from '../middleware/validation';
import * as userService from '../services/user.service';

export async function userRoutes(app: FastifyInstance) {
  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: '分页列出用户',
        security: [{ cookieAuth: [] }],
        response: {
          200: toJsonSchema(paginatedSchema(userSchema)),
          401: toJsonSchema(errorResponseSchema),
        },
      },
      onRequest: [requireAuth],
    },
    async (req) => {
      const { page, pageSize } = parseQuery(paginationSchema, req);
      return userService.listUsers(page, pageSize);
    },
  );

  app.get(
    '/users/:id',
    {
      schema: {
        tags: ['users'],
        summary: '按 ID 查询用户',
        params: toJsonSchema(idParamSchema),
        response: { 200: toJsonSchema(userSchema) },
      },
      onRequest: [requireAuth],
    },
    async (req) => {
      const { id } = parseParams(idParamSchema, req);
      const user = await userService.getUserById(id);
      if (!user) throw Errors.notFound('User not found');
      return user;
    },
  );

  app.patch(
    '/users/:id',
    {
      schema: {
        tags: ['users'],
        summary: '更新用户昵称（仅本人）',
        params: toJsonSchema(idParamSchema),
      },
      onRequest: [requireAuth],
    },
    async (req) => {
      const { id } = parseParams(idParamSchema, req);
      if (req.auth?.userId !== id) throw Errors.forbidden('只能修改自己的资料');
      const body = req.body as { name?: string };
      if (!body?.name || body.name.length < 2 || body.name.length > 100) {
        throw Errors.badRequest('Invalid name');
      }
      const user = await userService.updateUser(id, { name: body.name });
      if (!user) throw Errors.notFound('User not found');
      return user;
    },
  );

  app.delete(
    '/users/:id',
    {
      schema: {
        tags: ['users'],
        summary: '删除用户（仅本人）',
        params: toJsonSchema(idParamSchema),
      },
      onRequest: [requireAuth],
    },
    async (req) => {
      const { id } = parseParams(idParamSchema, req);
      if (req.auth?.userId !== id) throw Errors.forbidden('只能删除自己的账号');
      const ok = await userService.deleteUser(id);
      if (!ok) throw Errors.notFound('User not found');
      return { success: true };
    },
  );
}
