import { z } from 'zod';

/** 埋点事件的基础类型：所有事件都带会话/页面上下文，由前端自动补齐 */
export const telemetryEventSchema = z.object({
  /** 事件类型，建议 `模块_动作`，如 page_view / todo_create / api_error */
  type: z.string().min(1).max(100),
  /** 事件发生时间（ISO 8601） */
  timestamp: z.string().datetime(),
  /** 页面路径（不含 query，避免敏感参数入日志） */
  path: z.string().max(500),
  /** 匿名会话 ID（浏览器本地生成，不含用户身份） */
  sessionId: z.string().min(1).max(100),
  /** 用户 ID（已登录时由后端从 session 补全，前端不传） */
  userId: z.string().optional(),
  /** 事件属性：键值对，值限定为可序列化标量 */
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

/** 批量上报请求体 */
export const telemetryBatchSchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(100),
});

export type TelemetryBatch = z.infer<typeof telemetryBatchSchema>;
