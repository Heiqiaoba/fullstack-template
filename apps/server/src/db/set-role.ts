/**
 * 角色管理命令行脚本：按邮箱把用户提升为管理员或降级为普通用户。
 *
 * 复用 db/index 的连接池直接更新 user.role，便于本地快速验证 admin 插件权限。
 * 运行方式：pnpm --filter @template/server exec tsx src/db/set-role.ts <email> [admin|user]
 * 生产环境也可通过 ADMIN_USER_IDS 环境变量授予管理员权限（无需改数据库），
 * 两种方式择一：env 方式在 lib/auth 的 admin 插件中生效。
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';

/**
 * 提权/降级入口：解析命令行参数，校验角色取值，按邮箱更新并返回变更结果。
 * 参数不合法或邮箱不存在时打印错误并以非零码退出，避免静默失败。
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
