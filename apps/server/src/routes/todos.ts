/**
 * 待办事项路由模块：待办的增删改查（CRUD）与分页列表示例。
 *
 * 依赖 lib/context 的 requireAuth/getAuth（所有端点都要求登录并以 userId 隔离数据）、
 * middleware/validation 校验请求、services/todo.service 执行业务逻辑；
 * 由 app.ts 挂到 /api/v1 前缀。创建操作通过 service 的事务封装同时初始化用户档案。
 */
import {
  createTodoSchema,
  idParamSchema,
  paginatedSchema,
  paginationSchema,
  todoSchema,
  updateTodoSchema,
} from '@template/shared';
import type { FastifyInstance } from 'fastify';
import { getAuth, requireAuth } from '../lib/context';
import { Errors } from '../lib/errors';
import { toJsonSchema } from '../lib/json-schema';
import { parseBody, parseParams, parseQuery } from '../middleware/validation';
import * as todoService from '../services/todo.service';

/** 注册全部待办路由；所有端点统一使用 requireAuth 守卫 */
export async function todoRoutes(app: FastifyInstance) {
  // 所有端点共用同一鉴权钩子；提取为常量避免每处重复引用
  const guard = requireAuth;

  app.get(
    '/todos',
    {
      schema: {
        tags: ['todos'],
        summary: '分页列出我的待办',
        response: { 200: toJsonSchema(paginatedSchema(todoSchema)) },
      },
      onRequest: [guard],
    },
    async (req) => {
      const { page, pageSize } = parseQuery(paginationSchema, req);
      return todoService.listTodos(getAuth(req).userId, page, pageSize);
    },
  );

  app.post(
    '/todos',
    {
      schema: {
        tags: ['todos'],
        summary: '创建待办（事务：同时初始化用户档案）',
        body: toJsonSchema(createTodoSchema),
        response: { 201: toJsonSchema(todoSchema) },
      },
      onRequest: [guard],
    },
    async (req, reply) => {
      const body = parseBody(createTodoSchema, req);
      const todo = await todoService.createTodoWithProfile(getAuth(req).userId, body.title);
      return reply.status(201).send(todo);
    },
  );

  app.patch(
    '/todos/:id',
    {
      schema: {
        tags: ['todos'],
        summary: '更新待办（仅本人）',
        params: toJsonSchema(idParamSchema),
        body: toJsonSchema(updateTodoSchema),
        response: { 200: toJsonSchema(todoSchema) },
      },
      onRequest: [guard],
    },
    async (req) => {
      const { id } = parseParams(idParamSchema, req);
      const body = parseBody(updateTodoSchema, req);
      if (body.title === undefined && body.completed === undefined) {
        throw Errors.badRequest('At least one field is required');
      }
      const todo = await todoService.updateTodo(getAuth(req).userId, id, body);
      if (!todo) throw Errors.notFound('Todo not found');
      return todo;
    },
  );

  app.delete(
    '/todos/:id',
    {
      schema: {
        tags: ['todos'],
        summary: '删除待办（仅本人）',
        params: toJsonSchema(idParamSchema),
      },
      onRequest: [guard],
    },
    async (req) => {
      const { id } = parseParams(idParamSchema, req);
      const ok = await todoService.deleteTodo(getAuth(req).userId, id);
      if (!ok) throw Errors.notFound('Todo not found');
      return { success: true };
    },
  );
}
