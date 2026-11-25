/**
 * 用户服务层：隔离路由与数据访问，集中用户相关的查询/更新逻辑。
 *
 * 依赖 db/index 的 db 实例与 schema、lib/dto 的 toUserDTO；被 routes/users 调用。
 * 所有查询只 select publicFields（白名单列），从源头避免把 password、banReason 等
 * 敏感列带出数据层；返回的 DTO 已由 toUserDTO 处理时间与角色收敛。
 */
import type { User } from '@template/shared';
import { count, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { toUserDTO } from '../lib/dto';

/** 用户服务层：隔离路由与数据访问，业务逻辑集中在此 */

/** 对外可见的用户列白名单：新增敏感字段时不会因 select() 全列查询而误泄露 */
const publicFields = {
  id: schema.users.id,
  name: schema.users.name,
  email: schema.users.email,
  role: schema.users.role,
  createdAt: schema.users.createdAt,
};

/**
 * 分页列出用户：列表查询与总数查询并行执行，缩短接口耗时。
 * 按创建时间倒序，保证新用户优先展示。
 */
export async function listUsers(page: number, pageSize: number) {
  const [rows, countRows] = await Promise.all([
    db
      .select(publicFields)
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(schema.users),
  ]);

  return {
    items: rows.map(toUserDTO),
    total: countRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

/** 按 ID 查询用户并返回 DTO；不存在时返回 null，由路由决定 404 */
export async function getUserById(id: string): Promise<User | null> {
  const [row] = await db
    .select(publicFields)
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return row ? toUserDTO(row) : null;
}

/** 更新用户资料：仅传 name，returning 复用白名单列，保证返回结构不含敏感字段 */
export async function updateUser(id: string, data: { name?: string }): Promise<User | null> {
  const [row] = await db
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, id))
    .returning(publicFields);
  return row ? toUserDTO(row) : null;
}

/** 删除用户：利用 returning 判断是否有行被删除，返回布尔值供路由构造响应 */
export async function deleteUser(id: string) {
  const [row] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id });
  return Boolean(row);
}
