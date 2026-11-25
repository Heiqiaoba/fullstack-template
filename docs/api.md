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
| GET | `/api/v1/users?page=1&pageSize=20` | 分页列出用户（total 为真实总数） |
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

错误码：`BAD_REQUEST`(400)、`UNAUTHORIZED`(401)、`FORBIDDEN`(403)、`NOT_FOUND`(404)、`CONFLICT`(409)、`VALIDATION_ERROR`(400)、`INTERNAL`(500)。

每个响应头都带 `x-request-id`，与后端日志关联。

## OpenAPI

设置 `ENABLE_DOCS=true` 后访问 `/docs`。生产环境建议配合 `DOCS_TOKEN` 或网关鉴权。Swagger schema 由共享 Zod schema 经 `z.toJSONSchema` 生成，声明了请求/响应结构与认证方式（cookieAuth）。
