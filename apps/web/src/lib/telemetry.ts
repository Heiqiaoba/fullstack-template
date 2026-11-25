/**
 * 前端埋点（Telemetry）模块：无感采集、批量上报、失败静默。
 *
 * 架构位置：作为横切关注点被 main.tsx 的 TelemetryBootstrap（初始化 + page_view）、
 * api/client.ts（api_error）、useTelemetryErrors（js_error / unhandled_rejection）调用，
 * 与业务组件解耦。
 *
 * 无感采集设计要点：
 * - 队列缓冲：事件先入内存队列，满 100 条或每 10 秒批量上报一次，减少请求数；
 * - sendBeacon：页面隐藏/卸载时改用 sendBeacon，浏览器在后台完成发送、不阻塞导航；
 * - 采样：VITE_TELEMETRY_SAMPLE < 1 时按比例随机丢弃，降低高流量环境负载；
 * - 失败静默：网络失败、序列化失败、存储不可用（隐私模式）全部吞掉，
 *   绝不抛错或产生未处理的 promise rejection；
 * - 不记 query：路径只取 pathname 并截断，避免 token 等敏感参数随事件外传；
 * - 总开关：VITE_TELEMETRY=false 可整体关闭；开发模式可用 VITE_TELEMETRY_DEBUG 打印。
 */
import type { TelemetryEvent } from '@template/shared';

type Props = NonNullable<TelemetryEvent['props']>;
type EventInput = Pick<TelemetryEvent, 'type'> & { props?: Props };

const ENDPOINT = '/api/v1/telemetry';
const SESSION_KEY = 'telemetry_session_id';
const MAX_BATCH = 100;
const FLUSH_INTERVAL = 10_000;

/**
 * 匿名会话 ID：优先写入 sessionStorage，同标签页内保持稳定。
 * 隐私模式 / iframe sandbox 下 storage 可能抛 SecurityError / QuotaExceededError，
 * 此时退化为内存 ID（刷新后变化，可接受——埋点绝不因存储失败而中断）。
 */
let memorySessionId: string | null = null;

function newSessionId(): string {
  // crypto.randomUUID 在非安全上下文（非 HTTPS/localhost）不存在，需兜底
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = newSessionId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    memorySessionId ??= newSessionId();
    return memorySessionId;
  }
}

/** 脱敏：只保留路径，绝不携带 query（可能含 token 等敏感参数） */
function safePath(): string {
  return window.location.pathname.slice(0, 500);
}

/**
 * 埋点采集器（单例实现）。
 * 所有方法都设计为「绝不因埋点失败影响业务」：关闭时直接返回、上报异常一律吞掉。
 */
class Telemetry {
  private queue: TelemetryEvent[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private enabled = import.meta.env.VITE_TELEMETRY !== 'false' && typeof navigator !== 'undefined';
  private sampleRate = Number(import.meta.env.VITE_TELEMETRY_SAMPLE ?? '1');
  private sessionId = '';
  private debug = import.meta.env.DEV && import.meta.env.VITE_TELEMETRY_DEBUG === 'true';
  // 监听器保存为成员：destroy 能成对移除，避免 StrictMode 反复 init/destroy 泄漏
  private onVisibility = () => {
    if (document.visibilityState === 'hidden') void this.flush(true);
  };
  private onPageHide = () => void this.flush(true);

  /**
   * 初始化采集器：启动定时批量上报并监听页面隐藏/卸载事件。
   * 由 TelemetryBootstrap 在应用入口调用一次；重复调用幂等（已有定时器则直接返回）。
   */
  init() {
    if (!this.enabled || this.timer) return;
    this.sessionId = getSessionId();
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL);
    // 用户无感：页面隐藏/卸载时用 sendBeacon 兜底，浏览器会在后台完成发送
    window.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
  }

  /**
   * 记录一个事件；采样未命中或采集器关闭时静默丢弃，绝不抛错影响业务。
   * 事件类型与路径都会截断到安全长度，避免异常输入撑爆上报体积。
   * @param type 事件类型（如 'page_view'、'api_error'）
   * @param props 可选的附加属性（不应包含敏感信息）
   */
  track(type: string, props?: Props) {
    if (!this.enabled) return;
    if (this.sampleRate < 1 && Math.random() >= this.sampleRate) return;
    if (!this.sessionId) this.sessionId = getSessionId();
    const event: TelemetryEvent = {
      type: type.slice(0, 100),
      timestamp: new Date().toISOString(),
      path: safePath(),
      sessionId: this.sessionId,
      props,
    };
    this.queue.push(event);
    if (this.debug) console.debug('[telemetry] track', event);
    if (this.queue.length >= MAX_BATCH) void this.flush();
  }

  /**
   * 立即上报当前队列（最多取 100 条）；失败静默，不产生未处理的 rejection。
   * 序列化失败（BigInt / 循环引用等非法 props）时把事件放回队列等待下一轮，
   * 避免 JSON.stringify 抛错冲破「埋点绝不影响业务」的约定。
   * @param beacon 为 true 时使用 sendBeacon（页面卸载场景，不阻塞导航）
   */
  flush(beacon = false): Promise<void> {
    if (!this.enabled || this.queue.length === 0) return Promise.resolve();
    const events = this.queue.splice(0, MAX_BATCH);
    let body: string;
    try {
      body = JSON.stringify({ events });
    } catch {
      // 不可序列化：放回队列头（下轮重试无益则由采样/容量自然淘汰），本轮静默放弃
      this.queue.unshift(...events);
      this.queue.length = Math.min(this.queue.length, MAX_BATCH);
      return Promise.resolve();
    }
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return Promise.resolve();
    }
    // fetch 静默失败：埋点绝不能影响业务，也不产生未处理的 promise rejection
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    })
      .catch(() => undefined)
      .then(() => undefined);
  }

  /** 停止定时上报并解除页面事件监听（测试/卸载用；队列保留以便下次 init 续传） */
  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    window.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
  }

  /** 仅供测试：读取队列长度 */
  get pending() {
    return this.queue.length;
  }
}

/** 全局埋点单例，所有调用方共享同一队列与定时器 */
export const telemetry = new Telemetry();

/**
 * 手动埋点的便捷函数：等价于 `telemetry.track`，如 `track('todo_create', { source: 'form' })`。
 * @param type 事件类型
 * @param props 可选附加属性
 */
export function track(type: string, props?: Props) {
  telemetry.track(type, props);
}

/** 埋点事件的输入类型（type + 可选 props），供需要声明事件参数的调用方复用 */
export type { EventInput };
