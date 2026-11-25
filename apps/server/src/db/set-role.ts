import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';

/**
 * 提权脚本：把指定邮箱的用户设为管理员。
 *   pnpm --filter @template/server exec tsx src/db/set-role.ts you@example.com admin
 * 生产也可用 ADMIN_USER_IDS 环境变量（无需改数据库）。
 */
async function main() {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: tsx src/db/set-role.ts <email> [admin|user]');
    process.exit(1);
  }
  if (role !== 'admin' && role !== 'user') {
    console.error('role must be "admin" or "user"');
    process.exit(1);
  }
  const rows = await db.update(users).set({ role }).where(eq(users.email, email)).returning({
    id: users.id,
    email: users.email,
    role: users.role,
  });
  if (!rows.length) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  console.log('Updated:', rows[0]);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
