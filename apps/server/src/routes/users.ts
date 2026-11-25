import { paginatedSchema, paginationSchema, registerSchema, userSchema } from '@template/shared';
import { desc } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { db, schema } from '../db';
import { parseBody, parseQuery } from '../middleware/validation';

export async function userRoutes(app: FastifyInstance) {
  /** GET /users - 分页列出用户 */
  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: 'List users',
        response: { 200: zodToJsonSchema(paginatedSchema(userSchema)) },
      },
    },
    async (req) => {
      const { page, pageSize } = parseQuery(paginationSchema, req);
      const rows = await db
        .select()
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const items = rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      }));

      return { items, total: items.length, page, pageSize };
    },
  );

  /** POST /users - 演示共享 Zod schema 校验；真实注册走 /api/auth/register */
  app.post(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: 'Validate a registration payload (demo)',
      },
    },
    async (req) => {
      const body = parseBody(registerSchema, req);
      return { valid: true, name: body.name, email: body.email };
    },
  );
}
