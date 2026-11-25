import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient, setTokenProvider } from './client';

/** 直接从真实 axios 实例中取出已注册的拦截器处理函数 */
function getResponseRejectHandler() {
  const handlers = (
    apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected?: (error: unknown) => unknown }>;
    }
  ).handlers;
  const handler = handlers.find((h) => typeof h.rejected === 'function')?.rejected;
  if (!handler) throw new Error('response reject interceptor not registered');
  return handler;
}

function getRequestFulfilledHandler() {
  const handlers = (
    apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled?: (config: unknown) => unknown }>;
    }
  ).handlers;
  const handler = handlers.find((h) => typeof h.fulfilled === 'function')?.fulfilled;
  if (!handler) throw new Error('request fulfilled interceptor not registered');
  return handler;
}

describe('api client', () => {
  it('normalizes a server error response into ApiError with code and requestId', async () => {
    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      {} as InternalAxiosRequestConfig,
      {},
      {
        status: 403,
        statusText: 'Forbidden',
        data: { error: { code: 'FORBIDDEN', message: '无权访问' }, requestId: 'req-1' },
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig,
      },
    );

    await expect(getResponseRejectHandler()(axiosError)).rejects.toMatchObject({
      name: 'ApiError',
      code: 'FORBIDDEN',
      message: '无权访问',
      status: 403,
      requestId: 'req-1',
    });
  });

  it('normalizes a timeout into ApiError with TIMEOUT code', async () => {
    await expect(
      getResponseRejectHandler()(new AxiosError('timeout', 'ECONNABORTED')),
    ).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('normalizes a network error into ApiError with NETWORK code', async () => {
    await expect(getResponseRejectHandler()(new AxiosError('offline'))).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('request interceptor injects X-Request-ID and optional Bearer token', async () => {
    setTokenProvider(() => 'my-token');
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = (await getRequestFulfilledHandler()(config)) as InternalAxiosRequestConfig;
    expect(result.headers.get('X-Request-ID')).toBeTruthy();
    expect(result.headers.get('Authorization')).toBe('Bearer my-token');
    // 清理，避免影响其他测试
    setTokenProvider(() => undefined);
  });

  it('ApiError exposes stable fields', () => {
    const err = new ApiError({ message: 'x', code: 'C', status: 400, details: { a: 1 } });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.code).toBe('C');
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ a: 1 });
  });
});
