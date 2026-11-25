import { and, count, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { withTransaction } from '../lib/transaction';

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
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      completed: Boolean(r.completed),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: countRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

/** 创建待办并同时初始化用户档案（演示事务：两步写入原子化） */
export async function createTodoWithProfile(userId: string, title: string) {
  return withTransaction(async (tx) => {
    await tx.insert(schema.profiles).values({ userId }).onConflictDoNothing();

    const [row] = await tx.insert(schema.todos).values({ userId, title }).returning();
    if (!row) throw new Error('Failed to create todo');

    return {
      id: row.id,
      title: row.title,
      completed: Boolean(row.completed),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function updateTodo(
  userId: string,
  id: string,
  data: { title?: string; completed?: boolean },
) {
  const [row] = await db
    .update(schema.todos)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.completed !== undefined ? { completed: data.completed ? 1 : 0 } : {}),
    })
    .where(and(eq(schema.todos.id, id), eq(schema.todos.userId, userId)))
    .returning();

  return row
    ? {
        id: row.id,
        title: row.title,
        completed: Boolean(row.completed),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
}

export async function deleteTodo(userId: string, id: string) {
  const [row] = await db
    .delete(schema.todos)
    .where(and(eq(schema.todos.id, id), eq(schema.todos.userId, userId)))
    .returning({ id: schema.todos.id });
  return Boolean(row);
}
