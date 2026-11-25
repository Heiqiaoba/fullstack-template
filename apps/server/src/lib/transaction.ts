/**
 * 数据库事务封装：为 service 层提供统一的事务边界。
 *
 * 依赖 db/index 的全局 db 实例，从 Drizzle 的 transaction 签名中推导出事务客户端
 * 类型 Tx；被 todo.service 的"创建待办 + 初始化档案"等多步写操作使用。
 * 集中封装的好处：调用方只写一个回调，无需关心 pool client 的获取与释放。
 */
import { db } from '../db';

/** 事务客户端类型：从 db.transaction 回调参数推导，保持与 Drizzle 版本同步 */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * 在单个数据库事务中执行多步写操作，任一环节抛错则整体回滚。
 *
 * 关键设计决策：用回调传递 tx，确保调用方不会误用全局 db 绕过事务；
 * 返回值与异常由 Promise 自然透传，调用方写法与普通异步函数一致。
 *
 * @param fn 接收事务客户端的异步操作
 * @returns fn 的结果；失败时事务回滚并向上抛错
 */
export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction((tx) => fn(tx));
}
