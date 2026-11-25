# API 设计

## 认证（Better Auth，前缀 `/api/auth`）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/sign-up/email` | 邮箱密码注册 |
| POST | `/api/auth/sign-in/email` | 邮箱密码登录 |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 获取当前会话 |

前端通过 `better-auth/react` 的 `signIn.email` / `signUp.email` / `signOut` / `useSession` 调用，Cookie 自动携带。

## 业务接口（前缀 `/api/v1`，需登录 Cookie）

### 用户
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/users?page=1&pageSize=20` | 分页列出用户（**仅管理员**，total 为真实总数） |
| GET | `/api/v1/users/me` | 获取当前登录用户 |
| GET | `/api/v1/users/:id` | 按 ID 查询 |
| PATCH | `/api/v1/users/:id` | 更新昵称（仅本人） |
| DELETE | `/api/v1/users/:id` | 删除用户（仅本人） |

### 待办
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/todos?page=1&pageSize=20` | 分页列出我的待办 |
| POST | `/api/v1/todos` | 创建（事务：同时幂等初始化用户档案） |
| PATCH | `/api/v1/todos/:id` | 更新标题/完成状态（仅本人） |
| DELETE | `/api/v1/todos/:id` | 删除（仅本人） |

### 运维
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/health` | liveness：进程存活与 uptime |
| GET | `/api/v1/ready` | readiness：数据库连通性，失败 503 |

## 统一响应

成功：业务 JSON 直接返回。

错误：
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "details": {} },
  "requestId": "uuid"
}
```

错误码：`BAD_REQUEST`(400)、`UNAUTHORIZED`(401)、`FORBIDDEN`(403)、`NOT_FOUND`(404)、`CONFLICT`(409)、`VALIDATION_ERROR`(400)、`RATE_LIMITED`(429)、`INTERNAL`(500)。

每个响应头都带 `x-request-id`，与后端结构化日志关联。

## 权限（RBAC）

用户模型带 `role` 字段（`user` / `admin`），由 Better Auth admin 插件管理：
- 默认角色 `user`；管理员通过 `ADMIN_USER_IDS` 环境变量或 `set-role.ts` 脚本指定
- `GET /api/v1/users` 为管理员端点（403 表示角色不足）
- 被封禁用户（`banned=true`）所有请求返回 403

**前端机制**（脚手架提供，页面留给业务）：
- `authClient.admin.*`：adminClient 插件已挂载，直接调用 `setRole/banUser/listUsers` 等端点，无需自行封装
- `useRole()` / `roleOf()`（[`lib/role.ts`](../apps/web/src/lib/role.ts)）：从 session 读取角色的两种形态
- `<RoleGate allow={['admin']}>` / `<AdminGuard>`：细粒度渲染门禁与路由守卫
- `/admin` 示例页：演示完整链路，业务开发时替换即可

注意：客户端门禁只管展示，**真正的安全边界永远是后端 `requireAdmin` 守卫**。

## 限流（分级）

| 范围 | 规则 |
|---|---|
| 全局 API | 100 次/分钟/IP（超限 `RATE_LIMITED` 429） |
| 认证 `/api/auth/*` | Better Auth 内置 20 次/分钟；登录/注册等敏感端点更严：**10 秒内最多 3 次**（防暴力破解） |
| 健康探针 `/health`、`/ready` | 豁免限流，供编排平台高频探测 |

## OpenAPI

设置 `ENABLE_DOCS=true` 后访问 `/docs`。生产环境建议配合 `DOCS_TOKEN` 或网关鉴权。Swagger schema 由共享 Zod schema 经 `z.toJSONSchema` 生成，声明了请求/响应结构与认证方式（cookieAuth）。

**类型生成与契约校验**（无需启动服务）：
```bash
pnpm api:generate   # 1) 从 buildApp() 离线导出 openapi.json → 2) 生成前端 TS 类型
```
产物 `packages/shared/openapi.json` 与 `apps/web/src/api/generated.d.ts` 纳入版本控制；[`contract.test.ts`](../apps/web/src/api/contract.test.ts) 用生成的类型反向校验 shared 契约，后端 schema 变更后忘记重新生成会导致类型检查失败。

## 前端埋点（用户无感）

前端自动采集：路由切换（`page_view`）、API 失败（`api_error`）、JS 错误（`js_error`/`unhandled_rejection`）；业务代码可用 `track('custom_event', { ... })` 手动埋点。事件在本地队列聚合后由 `sendBeacon` / `fetch keepalive` 上报，用户完全无感。

| 项 | 说明 |
|---|---|
| 接收端点 | `POST /api/v1/telemetry`（无需登录，匿名事件也采集；已登录时后端从 cookie 静默补 userId） |
| 响应 | `202 { accepted: n }`；埋点失败绝不影响业务 |
| 隐私 | 只记路径不记 query；属性限定标量；生产日志只记聚合计数 |
| 配置 | `VITE_TELEMETRY`（开关）、`VITE_TELEMETRY_SAMPLE`（采样率 0~1）、`VITE_TELEMETRY_DEBUG`（开发调试） |
| 存储 | 默认结构化日志（ELK/Loki 可采集）；接数仓只需替换 `lib/telemetry-sink.ts` 的 `write()` |

事件契约定义在 `packages/shared/src/telemetry.ts`，前后端共用同一份 Zod schema 校验。
