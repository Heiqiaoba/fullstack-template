/**
 * OpenAPI 规范离线导出脚本。
 *
 * 复用 app.ts 的 buildApp（会触发 env 校验与插件注册），调用 app.ready() 让路由
 * schema 全部注册完毕后从 app.swagger() 取出规范写入文件。
 * 运行方式：pnpm --filter @template/server exec tsx src/scripts/export-openapi.ts [output]
 * 默认输出到 ../../packages/shared/openapi.json，供前端/SDK 生成使用；
 * 不启动监听端口，导出完即关闭应用。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildApp } from '../app';

/** 导出规范到指定路径（默认 shared 包），自动创建缺失的父目录 */
async function main() {
  const out = process.argv[2] ?? '../../packages/shared/openapi.json';
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  mkdirSync(out.substring(0, out.lastIndexOf('/')), { recursive: true });
  writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`OpenAPI spec written to ${out}`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
