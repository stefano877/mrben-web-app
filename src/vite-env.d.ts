/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the MrBen backend. Unset = local mock mode. */
  readonly VITE_API_BASE?: string
  /** Analytics collection endpoint. Unset = funnel events are a no-op (dev logs only). */
  readonly VITE_ANALYTICS_URL?: string
  /** Affiliate postback endpoint (MRB-10). Unset = conversions are a dev-log no-op. */
  readonly VITE_AFFILIATE_POSTBACK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
