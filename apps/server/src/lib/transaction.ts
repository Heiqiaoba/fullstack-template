import { db } from '../db';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** 事务包装：把多步写操作放在同一个数据库事务中 */
export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction((tx) => fn(tx));
}
