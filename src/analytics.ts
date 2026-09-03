// Player-site analytics SDK (MRB-100) — the client that feeds the MRB-63
// pipeline (POST /v1/analytics/events + /identify).
//
// Contract source of truth: packages/shared-types/src/lib/analytics.ts in the
// backend repo. The repos are split (the player site is standalone on Vercel,
// MRB-58), and @mrben/shared-types is not published yet, so the taxonomy below
// is VENDORED per MRB-100 option 2 — re-copy it when the backend taxonomy changes.
//
// Design notes:
//  • anonId is persistent forever (localStorage) so pre-registration behaviour
//    joins to the player after identify() (MRB-63 R2).
//  • sessionId rotates after ~30 min of inactivity — a "sitting", not the auth session.
//  • Events are queued and flushed in batches of <=50, on a timer, at the batch
//    limit, and — crucially — with sendBeacon on unload so the tail of a session
//    (where the abandonment is) still arrives.
//  • Failure is silent. Analytics must never break a page.

import { API_BASE } from './api'

// ─── Closed taxonomy (vendored — keep in sync with backend shared-types) ──────
// The browser may emit ONLY these. An unknown name fails at compile time here,
// and would be a 400 at the server (which rejects the whole batch).
export type ClientEventName =
  | 'page_viewed'
  | 'signup_started'
  | 'signup_submitted'
  | 'login_started'
  | 'game_opened'
  | 'game_searched'
  | 'deposit_started'
  | 'withdrawal_started'
  | 'kyc_started'
  | 'rg_limit_opened'
  | 'promotion_viewed'

// Server-emitted names — NEVER sent from the browser (listed for reference; a
// browser asserting these is asserting money moved). The server emits them from
// the code that actually saw it happen:
//   signup_completed · login_succeeded · login_failed · password_reset_completed
//   deposit_completed · deposit_failed · withdrawal_requested · kyc_status_changed
//   rg_limit_set · rg_denied · bonus_granted · session_revoked

type Props = Record<string, unknown>
interface QueuedEvent { name: ClientEventName; properties?: Props; occurredAt: string }

const EVENTS_URL = API_BASE ? `${API_BASE}/v1/analytics/events` : ''
const IDENTIFY_URL = API_BASE ? `${API_BASE}/v1/analytics/identify` : ''
const MAX_BATCH = 50            // MAX_ANALYTICS_BATCH — hard server limit
const FLUSH_MS = 3000
const SESSION_IDLE_MS = 30 * 60 * 1000
const TOKEN_KEY = 'mrben.token' // same key the API client uses (api/http.ts)
const ANON_KEY = 'mrben.anonId'
const SID_KEY = 'mrben.analytics.sid'
const SID_TS_KEY = 'mrben.analytics.sid.ts'

function uuid(): string {
  try { const u = globalThis.crypto?.randomUUID?.(); if (u) return u } catch { /* fall through */ }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}
function get(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function set(k: string, v: string): void { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

// Anon id — generated once, then reused forever. Never regenerated on navigation.
function anonId(): string { let a = get(ANON_KEY); if (!a) { a = uuid(); set(ANON_KEY, a) } return a }

// Session id — a fresh uuid after 30 min of inactivity. Touched on every event.
function sessionId(): string {
  const now = Date.now()
  const last = Number(get(SID_TS_KEY) || 0)
  let s = get(SID_KEY)
  if (!s || !last || now - last > SESSION_IDLE_MS) { s = uuid(); set(SID_KEY, s) }
  set(SID_TS_KEY, String(now))
  return s
}

let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | undefined

function scheduleFlush(): void {
  if (timer) return
  timer = setTimeout(() => { timer = undefined; flush() }, FLUSH_MS)
}

// Flush the queue in <=50-event batches. `beacon` (used on unload) guarantees
// delivery but cannot set headers; the timed path uses fetch so it can carry the
// correlation id and bearer token.
function flush(beacon = false): void {
  if (!EVENTS_URL || queue.length === 0) return
  const aid = anonId(); const sid = sessionId()
  while (queue.length) {
    const events = queue.splice(0, MAX_BATCH)
    const body = JSON.stringify({ anonId: aid, sessionId: sid, events })
    if (beacon) {
      try { navigator.sendBeacon?.(EVENTS_URL, new Blob([body], { type: 'application/json' })) } catch { /* drop */ }
      continue
    }
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json', 'x-correlation-id': uuid() }
      const token = get(TOKEN_KEY); if (token) headers['authorization'] = `Bearer ${token}`
      void fetch(EVENTS_URL, { method: 'POST', headers, body, keepalive: true })
        .then(r => { if (import.meta.env.DEV && r.status === 400) console.warn('[analytics] batch rejected (400) — taxonomy/contract mismatch') })
        .catch(() => { /* unreachable analytics must not affect the page */ })
    } catch { /* drop */ }
  }
}

/** Record a client-taxonomy event. Typed, so an unknown name fails typecheck. Never throws. */
export function track(name: ClientEventName, properties?: Props): void {
  try {
    sessionId() // touch activity / rotate if idle
    if (!EVENTS_URL) { if (import.meta.env.DEV) console.debug('[analytics]', name, properties ?? ''); return }
    queue.push({ name, properties, occurredAt: new Date().toISOString() })
    if (queue.length >= MAX_BATCH) flush()
    else scheduleFlush()
  } catch { /* never break the page */ }
}

/** Convenience for the router — fire page_viewed with the path. */
export function pageView(path: string): void { track('page_viewed', { path }) }

/**
 * Link the anon id to the signed-in player and back-fill their prior events
 * (MRB-63). Call after registration (the important one) and after login. Reads
 * the bearer from storage if not passed. On 409 (anon id already claimed) it
 * regenerates the anon id and carries on, per the contract.
 */
export async function identify(token?: string): Promise<void> {
  try {
    if (!IDENTIFY_URL) return
    const bearer = token || get(TOKEN_KEY)
    if (!bearer) return
    const res = await fetch(IDENTIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${bearer}`, 'x-correlation-id': uuid() },
      body: JSON.stringify({ anonId: anonId() }),
    })
    if (res.status === 409) { set(ANON_KEY, uuid()) } // claimed by another player — fresh id, carry on
  } catch { /* silent */ }
}

// Guarantee the last batch leaves on unload — a normal request is cancelled when
// the page goes away, which loses exactly the events that mark abandonment.
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true) })
  window.addEventListener('pagehide', () => flush(true))
}
