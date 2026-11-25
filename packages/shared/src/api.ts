/**
 * 通用 API 契约（前后端共享的 Zod schema 与推导类型）。
 *
 * 这里定义的是跨模块复用的基础结构：错误响应、分页、ID 参数，以及待办（Todo）的
 * 输入/输出形状。server 用它们校验入参与约束响应，web 用同一份规则做表单校验，
 * 从而避免两端字段约定漂移。修改本文件后必须执行 `pnpm api:generate` 重新生成
 * OpenAPI 文档与前端类型。
 */
import { z } from 'zod';

/** 统一错误响应结构：所有非 2xx 响应都遵循此形状，requestId 与日志关联 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** 分页查询参数 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** 分页响应封装 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 通用 ID 路径参数：用于 `/api/v1/.../:id` 一类路由的入参校验 */
export const idParamSchema = z.object({ id: z.string().min(1) });

/** 待办事项：单个 Todo 的完整输出形状，时间戳为 ISO 8601 字符串 */
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

/** 创建待办的输入：仅需标题，长度 1~200 */
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/** 更新待办的输入：标题与完成状态均可选，但至少应传一项（由调用方保证） */
export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
