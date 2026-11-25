/**
 * Better Auth 官方生成的 Drizzle schema（provider: pg, 字段 snake_case）。
 *
 * 表名保持单数：user / session / account / verification，与 drizzleAdapter 默认映射一致。
 * 本模块被 db/schema.ts 聚合导出，再经 db/index 注册到 Drizzle，最终供
 * lib/auth 的 drizzleAdapter 与各类 service 查询使用；不依赖业务模块。
 * role/banned 等列是为 Better Auth admin 插件预留的 RBAC 字段。
 */
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * 用户表：认证主体，兼任 RBAC 载体。
 * role 默认 user，adminRoles 由 lib/auth 的 admin 插件配置；banned 用于封禁判定。
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  // RBAC（Better Auth admin 插件）：user / admin
  role: text('role').default('user').notNull(),
  banned: boolean('banned').default(false).notNull(),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** 会话表：token 唯一且按 userId 建索引，支持按用户快速查询/吊销会话 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    impersonatedBy: text('impersonated_by'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

/** 第三方账号/凭证表：保存 provider 与 OAuth token、密码哈希，按 userId 建索引 */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

/** 验证表：存放邮箱验证/密码重置等一次性令牌，按 identifier 建索引 */
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);
