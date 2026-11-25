import { z } from 'zod';

/** 统一错误响应结构 */
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

/** 通用 ID 路径参数 */
export const idParamSchema = z.object({ id: z.string().min(1) });

/** 待办事项 */
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
