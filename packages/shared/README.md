# @template/shared

前后端共享的 Zod schema、类型与契约定义。

- 运行时校验（前后端同一份规则）
- 编译期类型（`z.infer` 推导，无需手写接口类型）
- 新增字段只改这里，前端类型检查会立刻报错

被 `apps/server` 与 `apps/web` 同时依赖。
