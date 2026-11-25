# 架构决策记录 (ADR)

## ADR-001：采用 pnpm workspace + Turborepo monorepo
- **状态**：Accepted
- **背景**：前后端需要共享 schema 与类型，且应统一构建/lint/test 流程。
- **决策**：apps/* 放应用，packages/* 放共享包；turbo 编排任务并按依赖缓存。
- **后果**：新增字段只改 `packages/shared`，前后端类型检查同时生效；需保证 shared 先于依赖方构建（`dependsOn: ^build`）。

## ADR-002：前后端共享 Zod schema 作为单一契约源
- **状态**：Accepted
- **背景**：手写接口类型与运行时校验容易漂移。
- **决策**：`packages/shared` 定义 Zod schema，前端用 `z.infer` 得类型、用 `parse` 校验响应；后端用同一 schema 做请求校验与 OpenAPI 生成（zod4 内置 `toJSONSchema`）。
- **后果**：契约统一；升级到 zod4 后需用 `flattenError` 替代 `error.flatten()`、`z.email()` 替代 `z.string().email()`。

## ADR-003：认证采用 Better Auth（数据库会话 + Cookie）
- **状态**：Accepted
- **背景**：需要邮箱密码注册/登录、会话管理、受保护路由，避免自造轮子。
- **决策**：Better Auth + Drizzle adapter 直连项目连接池；`toNodeHandler` 挂载到 `/api/auth/*`；前端用 `better-auth/react`；session 存数据库，Cookie HttpOnly + SameSite=Lax，生产 Secure。
- **后果**：认证表由官方 schema 生成器产出并纳入 Drizzle 迁移；生产必须设置强 `BETTER_AUTH_SECRET`。

## ADR-004：分层为 routes → services → db
- **状态**：Accepted
- **背景**：路由里直接写 SQL 会导致业务复杂后难以维护。
- **决策**：路由只做 HTTP 解析/响应，业务逻辑在 services，数据访问在 db；多步写入用 `withTransaction` 包事务。
- **后果**：可独立测试 service；后续引入缓存/队列无需改路由。

## ADR-005：API 版本前缀 /api/v1
- **状态**：Accepted
- **背景**：无版本前缀的 breaking change 会影响所有客户端。
- **决策**：业务接口统一 `/api/v1/*`，认证接口由 Better Auth 管理保持 `/api/auth/*`。
- **后果**：未来 v2 可并行部署。

## ADR-006：分级健康检查
- **状态**：Accepted
- **背景**：单一 health 只看进程存活，无法判断数据库是否可用。
- **决策**：`/api/v1/health` 为 liveness（进程 uptime），`/api/v1/ready` 为 readiness（执行 `select 1` 探测数据库，失败返回 503）。
- **后果**：K8s/负载均衡可分别配置存活与就绪探针。

## ADR-007：文档默认关闭、生产需显式开启并保护
- **状态**：Accepted
- **背景**：Swagger UI 在生产暴露会泄露接口信息。
- **决策**：`ENABLE_DOCS` 默认 false；开启时可用 `DOCS_TOKEN` 做简单 Bearer 保护，建议前置网关鉴权。
- **后果**：开发便利与生产安全兼顾。

## ADR-008：RBAC 采用 Better Auth admin 插件
- **状态**：Accepted
- **背景**：用户列表等接口需要角色区分，避免自造权限系统。
- **决策**：user 表加 role/banned 字段（插件官方 schema），服务端用 `requireAuth` / `requireAdmin` 守卫，管理员通过 `ADMIN_USER_IDS` 或提权脚本指定。
- **后果**：认证与权限共用一套会话；角色变更无需改前端路由逻辑。

## ADR-009：OpenAPI 类型生成 + 契约测试
- **状态**：Accepted
- **背景**：Swagger 文档与 TS 类型割裂，后端改 schema 前端可能不知道。
- **决策**：`buildApp()` 离线导出 openapi.json → openapi-typescript 生成前端类型；契约测试用生成类型反向约束 shared 包；CI 检查生成物是否干净。
- **后果**：契约变更必须显式重新生成，杜绝隐式漂移。

## ADR-010：结构化请求日志
- **状态**：Accepted
- **背景**：排查问题需要按 requestId 聚合一次请求的所有日志。
- **决策**：每请求分配 UUID，用 Pino child logger 携带 requestId/method/path；`onResponse` 记录结构化访问日志（status/durationMS），query 不记录防敏感参数泄露。
- **后果**：日志可按 requestId 串联；敏感字段（cookie/authorization/password）自动脱敏。

## ADR-011：分级限流
- **状态**：Accepted
- **背景**：全局单一限流既不能防认证爆破，也会误伤健康检查探针。
- **决策**：全局 100/min/IP；认证端点用 Better Auth 内置 20/min；健康探针豁免限流。
- **后果**：安全与可观测性兼顾；限流响应统一返回 `RATE_LIMITED` 错误码。
