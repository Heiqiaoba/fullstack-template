# Fullstack Template

生产级前后端分离脚手架，已接入认证、权限、完整 CRUD、事务、可观测性与容器化部署。

- **前端**：Vite 5 + React 18 + TypeScript + Tailwind CSS 3 + Ant Design 5 + TanStack Query 5 + React Router 7
- **后端**：Node 22 + Fastify 5 + Drizzle ORM + PostgreSQL 16
- **认证**：Better Auth（邮箱密码 + 数据库会话 + Cookie）+ 受保护路由
- **共享**：Zod 4 schema + TypeScript 类型（前后端复用，单一契约源）
- **工程**：pnpm workspace + Turborepo + Biome + Vitest + Husky

## 快速开始

```bash
# 0. 前置：Node >= 22、pnpm 9.15.9（corepack enable）、Docker
cp .env.example .env
# 把 BETTER_AUTH_SECRET 换成强随机值：openssl rand -base64 32

# 1. 安装依赖
pnpm install

# 2. 启动数据库
docker compose -f docker/docker-compose.yml up -d postgres

# 3. 生成并运行迁移
pnpm db:generate       # 若 schema 变更才需要重新生成
pnpm db:migrate
pnpm db:seed           # 可选：填充演示数据

# 4. 启动开发服务器（前端 5173 / 后端 3000）
pnpm dev
```

打开 http://localhost:5173，注册账号即可体验完整的认证 → 用户列表 → 待办 CRUD 流程。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动前后端开发服务器 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` / `pnpm typecheck` | 代码检查 / 类型检查 |
| `pnpm test` | 运行所有测试 |
| `pnpm format` | 格式化代码 |
| `pnpm db:generate` | 根据 schema 生成 Drizzle 迁移 |
| `pnpm db:migrate` | 执行迁移 |
| `pnpm db:seed` | 填充种子数据 |

## 架构概览

```
浏览器 (5173)
  │  Vite /api 代理 → server:3000；better-auth/react 管理会话
  ▼
React SPA
  ├── AuthGuard（受保护路由）/ ErrorBoundary / 404
  ├── TanStack Query（缓存 + 乐观更新 + 失效重取）
  └── axios（统一错误归一化 + 请求追踪 ID）
  ▼
Fastify /api
  ├── /api/auth/*      Better Auth handler（注册/登录/登出/会话）
  └── /api/v1/*        health / ready / users / todos
        ├── middleware  helmet / cors / rate-limit / 统一错误处理
        ├── routes      HTTP 层（thin）
        ├── services    业务逻辑（CRUD + 事务）
        └── db          Drizzle schema + 连接池
  ▼
PostgreSQL 16
```

## API

- 认证：`/api/auth/*`（Better Auth 自动提供）
- 业务：`/api/v1/users`、`/api/v1/todos`（需登录 Cookie）
- 健康检查：`/api/v1/health`（liveness）、`/api/v1/ready`（readiness，含数据库探测）
- 文档：开发环境 `ENABLE_DOCS=true` 时访问 `/docs`

## 生产部署

```bash
# 1. 设置必需环境变量
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
export BETTER_AUTH_URL=https://your-domain.com

# 2. 构建并启动全栈（PostgreSQL + Server + Web/Nginx）
docker compose -f docker/docker-compose.yml up -d --build

# 3. 在 server 容器内执行迁移
docker compose -f docker/docker-compose.yml exec server node apps/server/dist/db/migrate.js
```

Nginx 将 `/api/*` 反向代理到 server，静态资源走缓存，SPA 路由 fallback 到 `index.html`。
详见 [docs/deployment.md](docs/deployment.md)。

## 目录结构

```
apps/
  web/      前端应用（React SPA）
  server/   后端服务（Fastify API）
packages/
  shared/   前后端共享的 Zod schema 与类型
  tsconfig/ 共享 TypeScript 配置
docker/     docker-compose + nginx 反向代理配置
docs/       架构决策、API、数据库、部署文档
```

## 文档索引

- [架构决策记录 (ADR)](docs/adr.md)
- [API 设计](docs/api.md)
- [数据库设计](docs/database.md)
- [部署指南](docs/deployment.md)
