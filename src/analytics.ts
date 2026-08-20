// Lightweight funnel analytics (MRB-59). Events are buffered and, when
// VITE_ANALYTICS_URL is set, flushed to that endpoint in batches (keepalive so
// the last batch survives navigation). With no endpoint it is a no-op in
// production and logs to the console in dev. Swap in the real pipeline later
// (MRB-63) by pointing VITE_ANALYTICS_URL at it.

export interface AnalyticsEvent { name: string; props?: Record<string, unknown>; at: number; sid: string }

const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL?.trim() || ''
const SID_KEY = 'mrben.sid'

function sid(): string {
  try {
    let s = sessionStorage.getItem(SID_KEY)
    if (!s) { s = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; sessionStorage.setItem(SID_KEY, s) }
    return s
  } catch { return 'anon' }
}

let queue: AnalyticsEvent[] = []
let timer: number | undefined

function flush() {
  if (!ENDPOINT || queue.length === 0) return
  const batch = queue; queue = []
  try {
    const body = JSON.stringify({ events: batch })
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) return
    void fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => { /* drop */ })
  } catch { /* drop */ }
}

/** Record a funnel event. Safe to call anywhere; never throws. */
export function track(name: string, props?: Record<string, unknown>): void {
  const e: AnalyticsEvent = { name, props, at: Date.now(), sid: sid() }
  if (!ENDPOINT) { if (import.meta.env.DEV) console.debug('[analytics]', name, props ?? ''); return }
  queue.push(e)
  window.clearTimeout(timer)
  timer = window.setTimeout(flush, 1500)
}

// Make sure a final batch goes out on unload.
if (typeof window !== 'undefined' && ENDPOINT) {
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
  window.addEventListener('pagehide', flush)
}
