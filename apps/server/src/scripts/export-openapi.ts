import { mkdirSync, writeFileSync } from 'node:fs';
import { buildApp } from '../app';

/** 离线导出 OpenAPI 规范：tsx src/scripts/export-openapi.ts [output] */
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
