# ============================================================
# 多阶段构建：builder 负责安装依赖 + 编译产物；runtime 只保留运行所需内容
# 镜像更小、攻击面更小；构建上下文为仓库根目录（见 docker-compose.yml）
# ============================================================

# ---- 阶段 1：deps & build ----
# 基于 Node 22，启用 corepack/pnpm，按 lockfile 安装后构建 shared 与 server
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages/ packages/
COPY apps/server/ apps/server/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @template/shared build && pnpm --filter @template/server build

# ---- 阶段 2：runtime ----
# 全新的精简 Node 镜像：不携带 builder 的源码/编译器，只复制 dist 与生产依赖
# 创建非 root 用户 app 运行服务，降低容器逃逸风险
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
# 复制 server 产物 + 其运行所需依赖（按 pnpm 部署推荐用 deploy）
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/drizzle ./apps/server/drizzle
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
# 切换到非 root 用户；暴露 3000 并配置健康检查（探活端点由 Fastify 提供）
USER app
EXPOSE 3000
WORKDIR /app/apps/server
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1
CMD ["node", "dist/index.js"]
