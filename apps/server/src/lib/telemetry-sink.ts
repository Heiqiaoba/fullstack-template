import type { TelemetryEvent } from '@template/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * 埋点 sink：默认结构化日志，便于直接接入 ELK / Loki / 云日志。
 * 生产接数仓时只需替换 `write()` 内部实现（批写 Kafka/ClickHouse/时序库），
 * 路由层无需改动。
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
