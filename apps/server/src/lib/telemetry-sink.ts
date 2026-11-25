/**
 * 埋点落地（sink）模块：唯一负责把前端上报事件写出去的边界。
 *
 * 依赖 config/env（区分环境）与 config/logger，消费 @template/shared 的
 * TelemetryEvent 类型，由 routes/telemetry 调用。采用可插拔设计：
 * 当前实现写结构化日志，接数仓时只需替换 write 内部实现（批写 Kafka/ClickHouse/
 * 时序库），路由层与事件格式都无需改动。
 */
import type { TelemetryEvent } from '@template/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * 写入一批埋点事件。
 *
 * 关键设计决策：
 * - 先按事件类型聚合计数，日志记录聚合结果而非逐条明细，避免日志爆炸；
 * - 开发环境保留事件明细便于调试，生产环境只记聚合，降低 PII 与日志量风险；
 * - 预留数仓写入点，未来接外部系统不影响调用方。
 *
 * @param events 已补全用户身份的埋点事件批次
 */
export async function writeTelemetry(events: TelemetryEvent[]) {
  // 采样告警：按事件类型聚合计数，便于观察量级（不打印每条明细，避免日志爆炸）
  const counts: Record<string, number> = {};
  for (const event of events) counts[event.type] = (counts[event.type] ?? 0) + 1;

  logger.info(
    {
      telemetry: true,
      count: events.length,
      types: counts,
      // 开发环境保留事件明细便于调试；生产只记聚合，避免 PII 与日志量风险
      events: env.NODE_ENV === 'development' ? events : undefined,
    },
    'telemetry batch received',
  );

  // 预留：await warehouse.insert(events)
}
