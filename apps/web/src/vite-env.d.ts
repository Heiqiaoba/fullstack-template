/// <reference types="vite/client" />

/**
 * 前端环境变量类型声明：为 Vite 注入的 import.meta.env 补充项目自定义变量的字段与含义。
 * 变量通过 .env 文件配置，构建时由 Vite 静态替换；此处声明可让 IDE 补全并防止拼写错误。
 */
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
