// Affiliate conversion events (MRB-10). When a player arrived on an affiliate
// link (btag present in first-touch attribution), we record postback-shaped
// conversion events at the key moments: registration, first deposit (FTD) and
// subsequent deposits. Real server-to-server postbacks fire from the backend off
// the event store; this carries the btag/affiliate id so that attribution is
// unambiguous and the backend can fire the affiliate network postback.

import { getAttribution } from './attribution'
import { track } from './analytics'

export type ConversionType = 'registration' | 'ftd' | 'deposit'

export function affiliateConversion(type: ConversionType, props: Record<string, unknown> = {}): void {
  try {
    const a = getAttribution()
    if (!a?.btag) return // only players sourced from an affiliate link
    track('affiliate_conversion', {
      type,
      btag: a.btag,
      affiliateId: a.affiliateId,
      campaign: a.affiliateCampaign,
      ...props,
    })
  } catch { /* never block the user flow */ }
}
