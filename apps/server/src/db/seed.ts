import 'dotenv/config';
import { db } from './index';
import { users } from './schema';

async function main() {
  await db
    .insert(users)
    .values({
      name: 'Seed User',
      email: 'seed@example.com',
      passwordHash: 'not-a-real-hash',
    })
    .onConflictDoNothing();
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
