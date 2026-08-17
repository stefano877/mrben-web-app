/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the MrBen backend. Unset = local mock mode. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
