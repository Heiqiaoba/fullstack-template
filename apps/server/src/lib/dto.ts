/**
 * DB 行 → API DTO 的唯一转换边界。
 *
 * 依赖 @template/shared 的契约类型约束输出，被所有 service 在返回数据前调用。
 * 集中在此处理两件事：Date 统一序列化为 ISO 字符串（JSON 边界稳定），
 * 以及敏感/内部字段显式剔除（白名单式映射，未来 DB 加字段不会误泄露）。
 * 任何 DB 行都不应绕过本模块直接进入 HTTP 响应。
 */
import type { Todo, User, UserRole } from '@template/shared';

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
  role: string | null;
  createdAt: Date;
};

type TodoRow = {
  id: string;
  title: string;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 用户行转对外 DTO：role 收敛为 shared 契约的 UserRole，时间转 ISO 字符串。
 * 刻意不映射 password/banReason/token 等内部或敏感列。
 */
export function toUserDTO(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: (row.role === 'admin' ? 'admin' : 'user') as UserRole,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * 待办行转对外 DTO：completed 从 DB 的 0/1 转为布尔，时间转 ISO 字符串。
 * 不暴露 userId 等归属字段（已由鉴权与路由层面保证数据隔离）。
 */
export function toTodoDTO(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
