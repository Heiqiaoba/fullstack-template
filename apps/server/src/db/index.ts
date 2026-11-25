/**
 * 数据库连接层：创建 pg 连接池并实例化 Drizzle ORM 客户端。
 *
 * 依赖 config/env 提供连接串与池上限，聚合 db/schema（业务表 + 认证表）作为
 * Drizzle 的 schema 注册中心；向上为 auth adapter、各 service 与 migrate/seed 脚本
 * 提供唯一的 db 实例。连接池在进程退出时由 closeDb 显式关闭。
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/** Drizzle 数据库客户端：注入 schema 以获得类型化查询与关系支持 */
export const db = drizzle(pool, { schema });
export { schema };

/**
 * 显式关闭连接池，供优雅退出与测试使用。
 * 必须 await，否则进程可能残留空闲连接导致挂起。
 */
export async function closeDb() {
  await pool.end();
}
