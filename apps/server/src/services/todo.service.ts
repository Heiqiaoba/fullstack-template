/**
 * 待办服务层：集中待办相关的查询与写操作，隔离路由与数据访问。
 *
 * 依赖 db/index 与 schema、lib/dto 的 toUserDTO、lib/transaction 的 withTransaction；
 * 被 routes/todos 调用。所有查询都带 userId 条件，从数据层强制租户/用户隔离：
 * 即便路由层遗漏鉴权，也无法读到他人的待办。
 */
import type { Todo } from '@template/shared';
import { and, count, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { toTodoDTO } from '../lib/dto';
import { withTransaction } from '../lib/transaction';

/**
 * 分页列出指定用户的待办：列表与总数并行查询，按创建时间倒序。
 */
export async function listTodos(userId: string, page: number, pageSize: number) {
  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(schema.todos)
      .where(eq(schema.todos.userId, userId))
      .orderBy(desc(schema.todos.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(schema.todos).where(eq(schema.todos.userId, userId)),
  ]);

  return {
    items: rows.map(toTodoDTO),
    total: countRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

/**
 * 创建待办并同时初始化用户档案（演示事务：两步写入原子化）。
 *
 * 关键设计决策：档案插入用 onConflictDoNothing 保证幂等，
 * 与待办插入处于同一事务——档案建好但待办失败时整体回滚，不留半成品状态。
 *
 * @param userId 所属用户 ID（来自鉴权上下文，不信任客户端）
 * @param title 待办标题
 * @returns 新待办的 DTO
 */
export async function createTodoWithProfile(userId: string, title: string): Promise<Todo> {
  return withTransaction(async (tx) => {
    await tx.insert(schema.profiles).values({ userId }).onConflictDoNothing();

    const [row] = await tx.insert(schema.todos).values({ userId, title }).returning();
    if (!row) throw new Error('Failed to create todo');
    return toTodoDTO(row);
  });
}

/**
 * 更新待办：只更新传入的字段，且 where 同时限定 id 与 userId，防止越权更新。
 * completed 由布尔转成 DB 的 0/1，返回 DTO 时再转回布尔。
 */
export async function updateTodo(
  userId: string,
  id: string,
  data: { title?: string; completed?: boolean },
): Promise<Todo | null> {
  const [row] = await db
    .update(schema.todos)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.completed !== undefined ? { completed: data.completed ? 1 : 0 } : {}),
    })
    .where(and(eq(schema.todos.id, id), eq(schema.todos.userId, userId)))
    .returning();

  return row ? toTodoDTO(row) : null;
}

/** 删除待办：where 同时限定 id 与 userId，用 returning 判断是否真的删除 */
export async function deleteTodo(userId: string, id: string) {
  const [row] = await db
    .delete(schema.todos)
    .where(and(eq(schema.todos.id, id), eq(schema.todos.userId, userId)))
    .returning({ id: schema.todos.id });
  return Boolean(row);
}
