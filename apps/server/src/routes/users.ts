/**
 * 用户路由模块：用户列表（管理员）、当前用户、按 ID 查询、更新与删除。
 *
 * 依赖 lib/context 的鉴权钩子与 getAuth、middleware/validation 的参数校验、
 * services/user.service 的数据访问，以及 lib/json-schema 把共享 Zod 契约转成
 * OpenAPI schema（文档与运行时校验同源）。由 app.ts 挂到 /api/v1 前缀。
 *
 * 安全约定：列表仅管理员可见；写操作校验 req.auth.userId 与目标 id 一致，
 * 防止用户通过替换路径参数越权修改/删除他人资料。
 */
import {
  errorResponseSchema,
  idParamSchema,
  paginatedSchema,
  paginationSchema,
  userSchema,
} from '@template/shared';
import type { FastifyInstance } from 'fastify';
import { getAuth, requireAdmin, requireAuth } from '../lib/context';
import { Errors } from '../lib/errors';
import { toJsonSchema } from '../lib/json-schema';
import { parseParams, parseQuery } from '../middleware/validation';
import * as userService from '../services/user.service';

/** 注册全部用户相关路由，包括权限守卫与 OpenAPI 元数据 */
export async function userRoutes(app: FastifyInstance) {
  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: '分页列出用户（仅管理员）',
        security: [{ cookieAuth: [] }],
        response: {
          200: toJsonSchema(paginatedSchema(userSchema)),
          401: toJsonSchema(errorResponseSchema),
          403: toJsonSchema(errorResponseSchema),
        },
      },
      onRequest: [requireAdmin],
    },
    async (req) => {
      const { page, pageSize } = parseQuery(paginationSchema, req);
      return userService.listUsers(page, pageSize);
    },
  );

  app.get(
    '/users/me',
    {
      schema: {
        tags: ['users'],
        summary: '获取当前登录用户',
        security: [{ cookieAuth: [] }],
        response: { 200: toJsonSchema(userSchema) },
      },
      onRequest: [requireAuth],
    },
    async (req) => {
      const user = await userService.getUserById(getAuth(req).userId);
      if (!user) throw Errors.notFound('User not found');
      return user;
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
