# Fullstack Template

生产级前后端分离脚手架。

- **前端**：Vite + React + TypeScript + Tailwind CSS + Ant Design + TanStack Query
- **后端**：Node + Fastify + Drizzle ORM + PostgreSQL
- **共享**：Zod schema + TypeScript 类型（前后端复用）
- **工程**：pnpm workspace + Turborepo + Biome + Vitest + Husky

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env

# 3. 启动数据库
docker compose -f docker/docker-compose.yml up -d

# 4. 生成并运行迁移
pnpm db:generate
pnpm db:migrate

# 5. 启动开发服务器（前端 5173 / 后端 3000）
pnpm dev
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动前后端开发服务器 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 代码检查 |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 运行测试 |
| `pnpm format` | 格式化代码 |
| `pnpm db:generate` | 生成 Drizzle 迁移 |
| `pnpm db:migrate` | 执行迁移 |
| `pnpm db:seed` | 填充种子数据 |

## 目录结构

```
apps/
  web/      前端应用
  server/   后端服务
packages/
  shared/   前后端共享的 Zod schema 与类型
  tsconfig/ 共享 TypeScript 配置
```

详细架构说明见各包内 README。
