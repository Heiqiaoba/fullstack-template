/**
 * Zod schema → OpenAPI JSON Schema 转换工具。
 *
 * 依赖 zod4 内置的 toJSONSchema，被各路由的 schema.response/params/body 声明调用，
 * 让前后端共享同一份 Zod 契约：校验规则只有一处定义，文档与运行时校验不会漂移。
 */
import { z } from 'zod';

/**
 * 把共享 Zod schema 转成 OpenAPI 3.1 兼容的 JSON Schema。
 * 指定 target 是因为默认 Draft 2020-12 与 OpenAPI 3.1 的抖动会导致文档校验差异。
 *
 * @param schema 来自 @template/shared 的 Zod schema
 * @returns 可直接放入 Fastify route schema 的 JSON Schema 对象
 */
export function toJsonSchema(schema: z.ZodTypeAny) {
  return z.toJSONSchema(schema, { target: 'openapi-3.1' });
}
