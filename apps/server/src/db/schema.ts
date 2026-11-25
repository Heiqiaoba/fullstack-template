/**
 * 业务数据模型定义（Drizzle + PostgreSQL），并作为认证表的统一出口。
 *
 * 依赖 db/auth-schema 中的 Better Auth 表，把 user/session/account/verification
 * 以语义化别名重新导出，供 db/index 注册到 Drizzle 及各 service 编写类型化查询。
 * 本模块只声明表结构与行类型，不含查询逻辑；字段命名（snake_case）由 Drizzle 列定义
 * 与 TypeScript 属性名解耦，DTO 转换集中在 lib/dto。
 */
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import * as auth from './auth-schema';

/**
 * 业务用户档案：与认证用户 1:1，仅存放认证之外的业务字段。
 * userId 唯一且外键级联删除，保证删除认证用户时档案不会残留孤儿行。
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => auth.user.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * 示例业务表：待办事项，用于演示 CRUD、事务、鉴权隔离与分页。
 * completed 用 integer(0/1) 而非 boolean，便于与 DTO 层显式转换成布尔值。
 */
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => auth.user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: integer('completed').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** 档案表查询结果行类型 */
export type ProfileRow = typeof profiles.$inferSelect;
/** 档案表插入入参类型 */
export type NewProfileRow = typeof profiles.$inferInsert;
/** 待办表查询结果行类型 */
export type TodoRow = typeof todos.$inferSelect;
/** 待办表插入入参类型 */
export type NewTodoRow = typeof todos.$inferInsert;

// 认证相关表从 auth-schema 统一导出，使上层只需依赖本模块
export const users = auth.user;
export const sessions = auth.session;
export const accounts = auth.account;
export const verifications = auth.verification;

/** 认证用户查询结果行类型 */
export type UserRow = typeof auth.user.$inferSelect;
/** 认证用户插入入参类型 */
export type NewUserRow = typeof auth.user.$inferInsert;
