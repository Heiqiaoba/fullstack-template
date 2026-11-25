import { beforeEach, describe, expect, it, vi } from 'vitest';

// 隔离环境：模拟浏览器存储与 sendBeacon/fetch
const store = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});
vi.stubGlobal('crypto', { randomUUID: () => 'session-1' });
vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
vi.stubGlobal('window', {
  location: { pathname: '/todos' },
  addEventListener: vi.fn(),
});
vi.stubGlobal('document', { visibilityState: 'visible' });
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve({ ok: true })),
);
vi.stubGlobal('Blob', class {});
vi.stubGlobal(
  'setInterval',
  vi.fn(() => 1),
);
vi.stubGlobal('clearInterval', vi.fn());

describe('telemetry', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('tracks events with sanitized path and stable session id', async () => {
    const { telemetry } = await import('./telemetry');
    telemetry.track('todo_create', { source: 'form' });
    expect(telemetry.pending).toBe(1);

    await telemetry.flush();
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call?.[1]?.body ?? '{}');
    expect(body.events[0]).toMatchObject({
      type: 'todo_create',
      path: '/todos',
      sessionId: 'session-1',
      props: { source: 'form' },
    });
    expect(telemetry.pending).toBe(0);
  });

  it('uses sendBeacon on page hide (user-invisible flush)', async () => {
    const { telemetry } = await import('./telemetry');
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
    const { telemetry } = await import('./telemetry');
    telemetry.track('click');
    await expect(telemetry.flush()).resolves.toBeUndefined();
  });
});
