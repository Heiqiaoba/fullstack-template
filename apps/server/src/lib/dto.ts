import type { Todo, User } from '@template/shared';

/**
 * DB 行 → API DTO 的唯一边界：
 * - Date 统一序列化为 ISO 字符串
 * - 敏感/内部字段在此显式剔除（未来加字段时不会误泄露）
 * - 类型用 shared 契约约束，改契约时这里会立刻报错
 */

type UserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

type TodoRow = {
  id: string;
  title: string;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserDTO(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toTodoDTO(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
