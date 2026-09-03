// Affiliate conversion events (MRB-10). When a player arrived on an affiliate
// link (btag present in first-touch attribution), we record postback-shaped
// conversion signals at the key moments: registration, first deposit (FTD) and
// subsequent deposits. Real server-to-server postbacks fire from the backend off
// the event store; this carries the btag/affiliate id so attribution is
// unambiguous and the backend can fire the affiliate network postback.
//
// NOTE: this is deliberately separate from the analytics SDK (analytics.ts).
// Affiliate conversions are not part of the closed analytics taxonomy — sending
// them to /v1/analytics/events would reject the whole batch. They go to their own
// optional postback endpoint (VITE_AFFILIATE_POSTBACK_URL) and are a no-op /
// dev-log until that is wired.

import { getAttribution } from './attribution'

export type ConversionType = 'registration' | 'ftd' | 'deposit'

const POSTBACK_URL = import.meta.env.VITE_AFFILIATE_POSTBACK_URL?.trim() || ''

export function affiliateConversion(type: ConversionType, props: Record<string, unknown> = {}): void {
  try {
    const a = getAttribution()
    if (!a?.btag) return // only players sourced from an affiliate link
    const payload = { type, btag: a.btag, affiliateId: a.affiliateId, campaign: a.affiliateCampaign, occurredAt: new Date().toISOString(), ...props }
    if (!POSTBACK_URL) { if (import.meta.env.DEV) console.debug('[affiliate]', type, payload); return }
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon?.(POSTBACK_URL, new Blob([body], { type: 'application/json' }))) return
    void fetch(POSTBACK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => { /* drop */ })
  } catch { /* never block the user flow */ }
}
