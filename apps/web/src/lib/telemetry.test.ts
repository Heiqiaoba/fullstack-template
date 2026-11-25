import { beforeEach, describe, expect, it, vi } from 'vitest';

// 隔离环境：模拟浏览器存储与 sendBeacon/fetch（隐私模式下 storage 可能抛错）
const store = new Map<string, string>();
const throwingStorage = {
  getItem: (_k: string) => {
    throw new Error('SecurityError');
  },
  setItem: (_k: string, _v: string) => {
    throw new Error('QuotaExceededError');
  },
};
let useThrowingStorage = false;
const storageProxy = {
  getItem: (k: string) =>
    useThrowingStorage ? throwingStorage.getItem(k) : (store.get(k) ?? null),
  setItem: (k: string, v: string) => {
    if (useThrowingStorage) throwingStorage.setItem(k, v);
    store.set(k, v);
  },
};
let uuidSeq = 0;
vi.stubGlobal('sessionStorage', storageProxy);
vi.stubGlobal('crypto', { randomUUID: () => `session-${++uuidSeq}` });
vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
vi.stubGlobal('window', { location: { pathname: '/todos' }, addEventListener: vi.fn() });
vi.stubGlobal('document', { visibilityState: 'visible' });
let fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('Blob', class {});
vi.stubGlobal(
  'setInterval',
  vi.fn(() => 1),
);
vi.stubGlobal('clearInterval', vi.fn());

async function loadFresh() {
  vi.resetModules();
  return import('./telemetry');
}

describe('telemetry', () => {
  beforeEach(() => {
    store.clear();
    useThrowingStorage = false;
    uuidSeq = 0;
    fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.clearAllMocks();
  });

  it('tracks events with sanitized path and stable session id', async () => {
    const { telemetry } = await loadFresh();
    telemetry.track('todo_create', { source: 'form' });
    expect(telemetry.pending).toBe(1);

    await telemetry.flush();
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call?.[1]?.body ?? '{}');
    expect(body.events[0]).toMatchObject({
      type: 'todo_create',
      path: '/todos',
      props: { source: 'form' },
    });
    // 同一会话内 sessionId 保持稳定
    telemetry.track('page_view');
    await telemetry.flush();
    const second = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[1]?.body ?? '{}',
    );
    expect(second.events[0].sessionId).toBe(body.events[0].sessionId);
  });

  it('uses sendBeacon on page hide (user-invisible flush)', async () => {
    const { telemetry } = await loadFresh();
    telemetry.track('page_view');
    await telemetry.flush(true);
    expect(globalThis.navigator.sendBeacon).toHaveBeenCalled();
    expect(telemetry.pending).toBe(0);
  });

  it('never throws when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const { telemetry } = await loadFresh();
    telemetry.track('click');
    await expect(telemetry.flush()).resolves.toBeUndefined();
  });

  it('falls back to in-memory session id when storage throws (privacy mode)', async () => {
    useThrowingStorage = true;
    const { telemetry } = await loadFresh();
    // 关键断言：storage 抛错不能影响 track / flush（埋点绝不影响业务）
    expect(() => telemetry.track('page_view')).not.toThrow();
    expect(telemetry.pending).toBe(1);
    await expect(telemetry.flush()).resolves.toBeUndefined();
    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body ?? '{}',
    );
    // 退化到内存 id，事件仍带合法 sessionId
    expect(typeof body.events[0].sessionId).toBe('string');
    expect(body.events[0].sessionId.length).toBeGreaterThan(0);
  });

  it('flush survives JSON.stringify failure (bad props like BigInt)', async () => {
    const { telemetry } = await loadFresh();
    telemetry.track('bad_event');
    // 直接把不可序列化的值塞进队列（模拟调用方绕过类型约束）
    const queue = (telemetry as unknown as { queue: Array<{ props?: unknown }> }).queue;
    const first = queue.at(0);
    if (first) first.props = { big: 1n };
    // 关键断言：stringify 失败不能产生 unhandled rejection 或抛错
    await expect(telemetry.flush()).resolves.toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
