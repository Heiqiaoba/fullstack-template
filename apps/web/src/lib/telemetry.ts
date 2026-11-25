import type { TelemetryEvent } from '@template/shared';

type Props = NonNullable<TelemetryEvent['props']>;
type EventInput = Pick<TelemetryEvent, 'type'> & { props?: Props };

const ENDPOINT = '/api/v1/telemetry';
const SESSION_KEY = 'telemetry_session_id';
const MAX_BATCH = 100;
const FLUSH_INTERVAL = 10_000;

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

/** 脱敏：只保留路径，绝不携带 query（可能含 token 等敏感参数） */
function safePath(): string {
  return window.location.pathname.slice(0, 500);
}

class Telemetry {
  private queue: TelemetryEvent[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private enabled = import.meta.env.VITE_TELEMETRY !== 'false' && typeof navigator !== 'undefined';
  private sampleRate = Number(import.meta.env.VITE_TELEMETRY_SAMPLE ?? '1');
  private sessionId = '';
  private debug = import.meta.env.DEV && import.meta.env.VITE_TELEMETRY_DEBUG === 'true';

  /** 在应用入口调用一次 */
  init() {
    if (!this.enabled || this.timer) return;
    this.sessionId = getSessionId();
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL);
    // 用户无感：页面隐藏/卸载时用 sendBeacon 兜底，浏览器会在后台完成发送
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.flush(true);
    });
    window.addEventListener('pagehide', () => void this.flush(true));
  }

  /** 记录一个事件；队列满或超过采样率时静默丢弃，绝不抛错影响业务 */
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

  /** 立即上报当前队列；beacon=true 时用 sendBeacon（不阻塞页面卸载） */
  flush(beacon = false): Promise<void> {
    if (!this.enabled || this.queue.length === 0) return Promise.resolve();
    const events = this.queue.splice(0, MAX_BATCH);
    const body = JSON.stringify({ events });
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

  /** 停止定时上报（测试/卸载用） */
  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** 仅供测试：读取队列长度 */
  get pending() {
    return this.queue.length;
  }
}

export const telemetry = new Telemetry();

/** 手动埋点用：track('todo_create', { source: 'form' }) */
export function track(type: string, props?: Props) {
  telemetry.track(type, props);
}

export type { EventInput };
