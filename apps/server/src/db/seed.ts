import 'dotenv/config';
import { db } from './index';
import { todos, users } from './schema';

/** 幂等 seed：不覆盖已有数据，仅填充演示账号与待办 */
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
