/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** 埋点总开关：false 关闭，默认开启 */
  readonly VITE_TELEMETRY?: string;
  /** 采样率 0~1，默认 1（全量） */
  readonly VITE_TELEMETRY_SAMPLE?: string;
  /** 开发环境下打印埋点事件，默认关闭 */
  readonly VITE_TELEMETRY_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
