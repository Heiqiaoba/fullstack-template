/**
 * 演示数据填充脚本：向空库写入一个示例用户与一条待办。
 *
 * 独立命令行入口，复用 db/index 的连接池与 db/schema 的表定义。
 * 运行方式：pnpm --filter @template/server exec tsx src/db/seed.ts
 * 设计为幂等：检测到已有用户即跳过，避免重复运行覆盖或污染既有数据。
 */
import 'dotenv/config';
import { db } from './index';
import { todos, users } from './schema';

/** 幂等 seed：不覆盖已有数据，仅填充演示账号与待办；结束显式退出以释放连接 */
async function main() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log('Seed skipped: database already has users.');
  } else {
    await db.insert(users).values({
      id: 'seed-user-000000000000000000001',
      name: 'Seed User',
      email: 'seed@example.com',
      emailVerified: false,
    });
    await db.insert(todos).values({
      userId: 'seed-user-000000000000000000001',
      title: '示例：探索这个脚手架',
    });
    console.log('Seed complete: 1 user + 1 todo.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
