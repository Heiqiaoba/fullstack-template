# @template/shared

前后端共享的 Zod schema、类型与契约定义，被 `apps/server` 与 `apps/web` 同时依赖。

> **单一契约源**：请求/响应的形状只在这里定义一次——server 用它校验入参与约束响应，web 用它推导类型与表单校验。新增字段只改这里，两端类型检查会立刻暴露不兼容处。**任何 schema 改动后必须执行 `pnpm api:generate`**，重新生成 `openapi.json` 与前端 `generated.d.ts`（两者纳入版本控制，CI 会校验无 diff）。

- 运行时校验：前后端同一份规则，避免字段约定漂移
- 编译期类型：由 `z.infer` 推导，无需手写接口类型

## 导出 schema 一览

统一出口为 `src/index.ts`，所有类型均可从 `@template/shared` 顶层导入。

### 通用 API 契约（`src/api.ts`）

| 导出 | 用途 |
|---|---|
| `errorResponseSchema` / `ErrorResponse` | 统一错误响应形状（`error.code/message/details` + `requestId`），所有非 2xx 响应遵循 |
| `paginationSchema` / `Pagination` | 分页查询参数（`page`、`pageSize`，带默认值与上限），供列表接口解析 query |
| `paginatedSchema(item)` / `Paginated<T>` | 分页响应封装工厂，产出 `{ items, total, page, pageSize }` |
| `idParamSchema` | `:id` 路径参数校验（非空字符串） |
| `todoSchema` / `Todo` | 单个待办的完整输出形状（含时间戳） |
| `createTodoSchema` / `CreateTodoInput` | 创建待办输入（仅 `title`，1~200） |
| `updateTodoSchema` / `UpdateTodoInput` | 更新待办输入（`title` / `completed` 均可选） |

### 用户契约（`src/user.ts`）

| 导出 | 用途 |
|---|---|
| `userRoleSchema` / `UserRole` | 角色枚举 `user` \| `admin`，RBAC 的基础类型 |
| `userSchema` / `User` | 对外用户资料（不含密码哈希等敏感字段） |
| `registerSchema` / `RegisterInput` | 注册输入（昵称、邮箱、密码及长度约束） |
| `loginSchema` / `LoginInput` | 登录输入（邮箱 + 非空密码） |
| `profileSchema` / `Profile` | 用户扩展档案（bio、头像、时间戳），按 `userId` 关联 |
| `updateProfileSchema` / `UpdateProfileInput` | 资料更新输入（昵称/简介/头像，均可选） |

### 埋点契约（`src/telemetry.ts`）

| 导出 | 用途 |
|---|---|
| `telemetryEventSchema` / `TelemetryEvent` | 单条埋点事件（类型、时间、脱敏路径、匿名 sessionId、可选 userId/标量属性） |
| `telemetryBatchSchema` / `TelemetryBatch` | 批量上报请求体（1~100 条），前后端批次上限一致 |

## 修改契约的正确姿势

1. 在 `src/` 修改 schema，补充/更新 `src/user.test.ts` 等守护测试
2. 运行 `pnpm api:generate`（导出 OpenAPI + 生成前端类型）
3. 提交 `openapi.json` 与 `apps/web/src/api/generated.d.ts` 的变更
4. `pnpm lint && pnpm typecheck && pnpm test` 全绿后再提交
