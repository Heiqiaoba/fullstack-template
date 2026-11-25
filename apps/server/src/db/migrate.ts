/**
 * 数据库迁移脚本：把 drizzle 生成的 SQL 迁移应用到目标数据库。
 *
 * 独立命令行入口，不经过 app.ts；依赖 config/env 的 DATABASE_URL 与
 * drizzle.config.ts 指向的 ./drizzle 迁移目录。
 * 运行方式：pnpm --filter @template/server exec tsx src/db/migrate.ts
 * 部署/本地首次建库时执行；幂等由 drizzle 迁移表保证，可重复运行。
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { env } from '../config/env';

/** 建立临时连接池、应用迁移并关闭连接；失败时由入口 catch 以非零码退出 */
async function main() {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
