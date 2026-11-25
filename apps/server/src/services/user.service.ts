import { count, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';

/** 用户服务层：隔离路由与数据访问，业务逻辑集中在此 */

export async function listUsers(page: number, pageSize: number) {
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(schema.users),
  ]);

  return {
    items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total: countRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export async function getUserById(id: string) {
  const [row] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
}

export async function updateUser(id: string, data: { name?: string }) {
  const [row] = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    createdAt: schema.users.createdAt,
  });
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
}

export async function deleteUser(id: string) {
  const [row] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id });
  return Boolean(row);
}
