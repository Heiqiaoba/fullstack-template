/**
 * 业务错误定义模块：统一的错误类型与工厂函数。
 *
 * AppError 携带稳定的业务 code 与 HTTP 状态码，供 middleware/error-handler
 * 识别并转成 { error, requestId } 响应；Errors 工厂统一各处抛错的口径，
 * 避免散落的字符串魔法值。被 context、middleware、routes、services 广泛依赖。
 */

/**
 * 业务错误基类：区分"可预期的业务失败"与"未知内部错误"。
 * statusCode 决定响应状态，code 供前端做分支处理，details 携带字段级校验信息。
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 常用业务错误工厂：调用方只传消息与可选 details，状态与 code 由工厂固定，
 * 保证同类错误在 API 中的 code 始终一致。
 */
export const Errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', message, details),
  unauthorized: (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Not found') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message = 'Conflict') => new AppError(409, 'CONFLICT', message),
  internal: (message = 'Internal server error') => new AppError(500, 'INTERNAL', message),
};
