import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import * as auth from './auth-schema';

/** 业务用户档案（与认证用户 1:1，存放认证之外的业务字段） */
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

/** 示例业务表：待办事项（演示 CRUD、事务、鉴权、分页） */
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

export type ProfileRow = typeof profiles.$inferSelect;
export type NewProfileRow = typeof profiles.$inferInsert;
export type TodoRow = typeof todos.$inferSelect;
export type NewTodoRow = typeof todos.$inferInsert;

// 认证相关表从 auth-schema 统一导出
export const users = auth.user;
export const sessions = auth.session;
export const accounts = auth.account;
export const verifications = auth.verification;

export type UserRow = typeof auth.user.$inferSelect;
export type NewUserRow = typeof auth.user.$inferInsert;
