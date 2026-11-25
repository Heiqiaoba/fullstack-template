# 部署指南

## 环境变量

必需：
- `BETTER_AUTH_SECRET`：强随机值（`openssl rand -base64 32`），生产缺失会启动失败
- `BETTER_AUTH_URL`：对外访问的基础 URL（如 `https://example.com`）

可选：
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`：数据库凭据，默认 postgres/postgres/app
- `CORS_ORIGIN`：允许的前端来源，默认 `http://localhost`
- `ENABLE_DOCS`：是否开启 Swagger，默认 false
- `DOCS_TOKEN`：Swagger 访问 token
- `DB_POOL_MAX`：连接池上限，默认 10
- `LOG_LEVEL`：日志级别

## 本地生产模拟

```bash
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
export BETTER_AUTH_URL=http://localhost
docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml exec server node apps/server/dist/db/migrate.js
```

访问 http://localhost。Nginx 监听 80，反代 `/api/*` 到 server:3000。

## 镜像构建

```bash
docker build -f apps/server/Dockerfile -t template-server .
docker build -f apps/web/Dockerfile -t template-web .
```

两个 Dockerfile 均使用多阶段构建：builder 阶段在 node:22-alpine 中安装依赖并编译，runtime 阶段仅保留运行所需产物（web 用 nginx:alpine 托管静态文件）。均以非 root 用户运行并配置 HEALTHCHECK。

## 迁移与发布顺序

1. 先发布数据库迁移（向后兼容：新增列带默认值、不直接删列）
2. 再滚动发布 server（新代码兼容旧 schema）
3. 最后发布 web

## 可观测性

- 每个 HTTP 响应带 `x-request-id`（UUID），后端 Pino 日志含同一 requestId
- 敏感字段（authorization / cookie / password / token）在日志中自动脱敏
- `/api/v1/ready` 供编排平台做就绪探针；server 与 web 容器均配置 HEALTHCHECK
- 进程收到 SIGTERM/SIGINT 时优雅关闭：停止接收请求 → 关闭数据库连接池
