/**
 * 共享包统一出口：server 与 web 均从 `@template/shared` 顶层导入。
 * 新增契约文件后需在此重新导出，并记得运行 `pnpm api:generate` 同步前端类型。
 */
export * from './user';
export * from './api';
export * from './telemetry';
