# @template/web

前端应用：Vite + React 18 + TypeScript + Ant Design 5 + TanStack Query 5 + React Router 7。

## 目录结构

```
apps/web/
├── index.html              # Vite 入口 HTML
├── vite.config.ts          # 开发服务器（/api 代理到 server:3000）
├── Dockerfile              # 多阶段构建：builder 编译 → nginx 托管
├── src/
│   ├── main.tsx            # 应用挂载、QueryClient / 路由 Provider
│   ├── App.tsx             # 路由表与全局布局
│   ├── api/                # 请求层
│   │   ├── client.ts       # axios 实例（错误归一化、requestId）
│   │   ├── users.ts / todos.ts  # 各资源 hooks（TanStack Query）
│   │   ├── keys.ts         # Query key 集中管理
│   │   ├── generated.d.ts  # ⚠️ 由 pnpm api:generate 生成，勿手改
│   │   └── contract.test.ts# 用生成类型反向校验 shared 契约
│   ├── components/         # 守卫/门禁、Header、错误边界、状态渲染
│   │   ├── AuthGuard.tsx / AdminGuard.tsx  # 路由级权限守卫
│   │   ├── RoleGate.tsx    # 细粒度角色渲染门禁
│   │   ├── ApiAuthSync.tsx # 401 时同步认证态
│   │   └── TelemetryBootstrap.tsx # 埋点初始化
│   ├── lib/                # auth-client（含 adminClient）、role、telemetry、queryClient
│   ├── routes/             # 页面：Home / Login / Todos / Admin / NotFound
│   ├── styles/             # Tailwind 入口与 Ant Design Less 覆盖
│   └── test/setup.ts       # Vitest + testing-library 初始化
```

## 开发命令

```bash
pnpm dev                              # 启动 Vite 开发服务器（5173）
pnpm --filter @template/web build     # 类型检查 + 生产构建（输出到 dist/）
pnpm --filter @template/web test      # 运行 Vitest
pnpm --filter @template/web typecheck # 仅类型检查
pnpm api:generate                     # 契约变更后生成 generated.d.ts（在仓库根执行）
```

## 注意事项

- **不要直接改 `src/api/generated.d.ts`**：它由 `pnpm api:generate` 从 `packages/shared/openapi.json` 生成，手工修改会在下次生成或 CI 契约校验时被覆盖/报错。schema 变更请先改 `packages/shared`，再在根目录执行 `pnpm api:generate`。
- 认证请求走同源 `/api/auth`：开发由 Vite proxy 转发，生产由 Nginx 反代；不要把带路径的 `VITE_API_URL` 传给 `authClient.baseURL`。
- `RoleGate` / `AuthGuard` 只控制展示与路由，真正的安全边界是后端守卫；管理 API 通过 `authClient.admin.*` 调用。
- 埋点默认开启，调试用 `VITE_TELEMETRY_DEBUG=true`，关闭用 `VITE_TELEMETRY=false`，采样率用 `VITE_TELEMETRY_SAMPLE`。
