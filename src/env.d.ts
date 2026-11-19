/// <reference types="vite/client" />

/** 环境变量类型补充 */
interface ImportMetaEnv {
  readonly VITE_APP_MODE?: 'dev' | 'family'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
