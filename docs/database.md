# 数据库设计

PostgreSQL 16，Drizzle ORM 管理 schema 与迁移，迁移文件在 `apps/server/drizzle/`。

## 表结构

### 认证表（Better Auth 官方 schema）
- `user`：id(PK, text)、name、email(unique)、emailVerified、image、createdAt、updatedAt
- `session`：id(PK)、token(unique)、userId → user.id(cascade)、expiresAt、ipAddress、userAgent、createdAt、updatedAt；索引 `session_userId_idx`
- `account`：id(PK)、accountId、providerId、userId → user.id(cascade)、各类 token、password、createdAt、updatedAt；索引 `account_userId_idx`
- `verification`：id(PK)、identifier、value、expiresAt、createdAt、updatedAt；索引 `verification_identifier_idx`

### 业务表
- `profiles`：id(PK, uuid)、userId → user.id(unique, cascade)、bio、avatarUrl、createdAt、updatedAt
- `todos`：id(PK, uuid)、userId → user.id(cascade)、title、completed(int 0/1)、createdAt、updatedAt

## 迁移流程

```bash
# 修改 apps/server/src/db/schema.ts 后
pnpm db:generate   # 生成新的 SQL 迁移到 drizzle/
pnpm db:migrate    # 应用迁移
```

迁移目录已纳入版本控制，禁止手动改数据库结构而不生成迁移文件。

## 事务与约束

- 创建待办时通过 `withTransaction` 在一个事务里幂等插入 profiles 再插入 todos，保证原子性。
- 用户删除采用数据库级联（cascade）清理 session/account/profiles/todos。
- 连接池：`DB_POOL_MAX` 控制最大连接数，空闲 30s 回收，连接超时 5s；进程退出时优雅关闭。
