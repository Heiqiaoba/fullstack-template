# ============================================================
# 多阶段构建：builder 编译前端静态资源；runtime 用 Nginx 托管产物并反代 API
# 构建上下文为仓库根目录（见 docker-compose.yml）
# ============================================================

# ---- 阶段 1：build ----
# 基于 Node 22，先构建 shared（前端依赖其类型/契约），再构建 web 得到 dist
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @template/shared build && pnpm --filter @template/web build

# ---- 阶段 2：runtime ----
# 直接从 nginx 镜像起步：复制站点配置（/api 反代 + SPA fallback）与构建产物
# 镜像内不含 Node 工具链，体积小；暴露 80 并探活首页
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
