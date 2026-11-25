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

打开 http://localhost:5173，注册账号即可体验完整的认证 → 用户列表（管理员）→ 待办 CRUD 流程。

管理员：注册后把 user id 配到 `ADMIN_USER_IDS` 环境变量，或执行 `pnpm --filter @template/server exec tsx src/db/set-role.ts you@example.com admin`。

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
| `pnpm api:generate` | 导出 OpenAPI 并生成前端类型（契约变更必跑） |

## 架构概览

```
浏览器 (5173)                       ← 入口：用户交互与会话保持（Cookie）
  │  Vite /api 代理 → server:3000；better-auth/react 管理会话
  ▼
React SPA                           ← 展现层：页面、状态与用户反馈
  ├── AuthGuard（受保护路由）/ ErrorBoundary / 404
  ├── TanStack Query（缓存 + 乐观更新 + 失效重取）
  └── axios（统一错误归一化 + 请求追踪 ID）
  ▼
Fastify /api                        ← 应用层：HTTP 协议与横切关注点
  ├── /api/auth/*      Better Auth handler（注册/登录/登出/会话）
  └── /api/v1/*        health / ready / users / todos
        ├── middleware  helmet / cors / rate-limit / 统一错误处理
        ├── routes      HTTP 层（thin，仅做参数校验与转发）
        ├── services    业务逻辑层（CRUD + 事务）
        └── db          数据访问层（Drizzle schema + 连接池）
  ▼
PostgreSQL 16                       ← 存储层：业务数据、会话与用户角色
```

各层职责一句话：浏览器负责承载 SPA 与会话；React SPA 负责交互与缓存；Fastify 路由负责协议适配，service 负责业务规则，db 负责持久化；PostgreSQL 负责可靠存储。

## API

- 认证：`/api/auth/*`（Better Auth 自动提供）
- 业务：`/api/v1/users`、`/api/v1/todos`（需登录 Cookie）
- 健康检查：`/api/v1/health`（liveness）、`/api/v1/ready`（readiness，含数据库探测）
- 文档：开发环境 `ENABLE_DOCS=true` 时访问 `/docs`

## 权限 / RBAC

用户带 `role` 字段（`user` / `admin`），默认 `user`；**客户端门禁只管展示，真正的安全边界是后端 `requireAdmin` 守卫**。

- 授予管理员：注册后把 user id 配到 `ADMIN_USER_IDS`（逗号分隔），或执行 `pnpm --filter @template/server exec tsx src/db/set-role.ts you@example.com admin`
- `adminClient`：Better Auth admin 插件已挂到 `authClient`，直接调用 `authClient.admin.setRole()` / `banUser()` / `listUsers()`
- `RoleGate`：`<RoleGate allow={['admin']}>` 按角色控制局部渲染；路由级用 `<AdminGuard>`
- `/admin` 示例页：演示「前端守卫 → adminClient → 后端 admin 插件」完整链路，业务开发时替换即可

详见 [docs/api.md](docs/api.md#权限rbac)。

## 埋点机制

前端用户无感自动采集：路由切换 `page_view`、API 失败 `api_error`、JS 错误 `js_error`；业务代码可调用 `track('todo_create', { source: 'form' })` 手动埋点。事件本地队列聚合后经 `sendBeacon` / `fetch keepalive` 上报，失败静默不影响业务。

| 配置项 | 说明 |
|---|---|
| `VITE_TELEMETRY` | 开关，`false` 关闭（默认开启） |
| `VITE_TELEMETRY_SAMPLE` | 采样率 0~1，`1` 全量、`0.1` 采 10% |
| `VITE_TELEMETRY_DEBUG` | 开发环境下打印事件，便于调试 |

后端接收端点 `POST /api/v1/telemetry`（无需登录，已登录时从 Cookie 静默补 `userId`），返回 `202 { accepted: n }`；默认 sink 写结构化日志，接数仓只需替换 `apps/server/src/lib/telemetry-sink.ts` 的 `write()`，路由层无需改动。隐私约定：只记路径不记 query，属性限定标量。契约见 `packages/shared/src/telemetry.ts`，详见 [docs/api.md](docs/api.md#前端埋点用户无感)。

## API 契约生成

`packages/shared` 是唯一契约源（Zod schema + 推导类型）。修改共享 schema 后必须重新生成契约产物：

```bash
pnpm api:generate
# 1) server 离线导出 packages/shared/openapi.json
# 2) 生成前端类型 apps/web/src/api/generated.d.ts
```

两个产物都纳入版本控制，CI 会校验「重新生成后无 diff」；忘记执行会导致类型检查失败。详见 [packages/shared/README.md](packages/shared/README.md) 与 [docs/api.md](docs/api.md#类型生成与契约校验无需启动服务)。

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
  web/      前端应用（React SPA）→ 详见 apps/web/README.md
  server/   后端服务（Fastify API）→ 详见 apps/server/README.md
packages/
  shared/   前后端共享的 Zod schema 与类型（单一契约源）
  tsconfig/ 共享 TypeScript 配置
docker/     docker-compose + nginx 反向代理配置
docs/       架构决策、API、数据库、部署文档
```

## 文档索引

- [架构决策记录 (ADR)](docs/adr.md)
- [API 设计](docs/api.md)
- [数据库设计](docs/database.md)
- [部署指南](docs/deployment.md)
