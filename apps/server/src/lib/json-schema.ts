import { z } from 'zod';

/** zod4 内置 toJSONSchema：把共享 Zod schema 转成 OpenAPI JSON Schema */
export function toJsonSchema(schema: z.ZodTypeAny) {
  return z.toJSONSchema(schema, { target: 'openapi-3.1' });
}
