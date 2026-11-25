# @template/server

后端服务：Node 22 + Fastify 5 + Drizzle ORM + PostgreSQL 16 + Better Auth。

## 目录结构

```
apps/server/
├── drizzle.config.ts       # Drizzle Kit 配置（迁移输出目录 ./drizzle）
├── drizzle/                # 生成的 SQL 迁移与快照（纳入版本控制）
├── Dockerfile              # 多阶段构建 + 非 root 运行
├── src/
│   ├── index.ts            # 进程入口：监听、优雅关闭（测试不走这里）
│   ├── app.ts              # buildApp()：插件、钩子、路由挂载（测试用 inject）
│   ├── config/             # env 校验、Pino 日志与请求作用域 logger
│   ├── db/                 # schema（业务表 + auth 表）、连接池、迁移/种子/设角色脚本
│   ├── lib/                # auth（Better Auth 单例）、context、dto、telemetry-sink 等
│   ├── middleware/         # 统一错误处理、Zod 校验中间件
│   ├── routes/             # 薄 HTTP 层：health / users / todos / telemetry
│   ├── services/           # 业务逻辑与事务
│   └── scripts/            # export-openapi.ts：离线导出 OpenAPI
```

## 开发命令

```bash
pnpm dev                                  # tsx watch 启动（3000）
pnpm --filter @template/server build      # 编译到 dist/
pnpm --filter @template/server test       # Vitest（含 supertest 路由测试）
pnpm db:generate                          # schema 变更后生成 SQL 迁移
pnpm db:migrate                           # 应用迁移到 DATABASE_URL
pnpm db:seed                              # 可选：填充演示数据
```

## 注意事项

- **auth 挂载顺序**：Better Auth 的 Node handler 通过 `onRequest` 钩子 hijack `/api/auth/*`，**必须在 JSON body parser 接管之前**（见 `src/app.ts`）。hijack 会绕过 Fastify 的 `onSend` 链，因此 CORS 与安全响应头需在钩子内手动补齐；不要把这些路由改成普通 JSON 插件。认证端点自带 20/min 限流，全局为 100/min，健康探针豁免。
- **迁移流程**：改 `src/db/schema.ts` → `pnpm db:generate` 生成迁移 SQL（提交 `drizzle/`）→ `pnpm db:migrate` 应用到数据库。迁移脚本幂等（由迁移表保证），可重复执行；容器部署时在 server 容器内运行 `node apps/server/dist/db/migrate.js`。
- 管理员由 `ADMIN_USER_IDS`（逗号分隔）或 `src/db/set-role.ts` 指定；未设置时无人是管理员，防止默认提权。
- API 文档默认关闭，`ENABLE_DOCS=true` 开启，生产建议配 `DOCS_TOKEN`。
- 契约来自 `@template/shared`：修改共享 schema 后在根目录执行 `pnpm api:generate`。
