// Region-unavailable screen (MRB-43 UI slice).
//
// IMPORTANT: real geo-blocking is enforced at the edge and in the backend, not
// here. A client-side check is bypassable and could wrongly block a real player,
// so this screen never auto-blocks on its own. It renders only when the edge or
// backend tells the app the region is restricted, or when previewed manually
// with ?geoblock=<CC> in the URL. The blocklist below is the display copy source
// and must mirror the authoritative list enforced at the edge.

// [CONFIRM] Restricted territories for the Anjouan licence and target markets.
export const RESTRICTED = ['US', 'FR', 'GB', 'NL', 'AU'] as const

const NAMES: Record<string, string> = { US: 'the United States', FR: 'France', GB: 'the United Kingdom', NL: 'the Netherlands', AU: 'Australia' }

// Returns a country code to block on, or null. Only from an explicit preview flag
// here; production passes the edge decision in instead.
export function previewBlockedRegion(): string | null {
  try {
    const cc = new URLSearchParams(window.location.search).get('geoblock')
    return cc ? cc.toUpperCase() : null
  } catch { return null }
}

export default function RegionBlock({ country }: { country?: string }) {
  const where = country && NAMES[country] ? NAMES[country] : 'your region'
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1020', color: '#fff', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 460 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ height: 34, width: 34, display: 'grid', placeItems: 'center', borderRadius: 9, background: '#F35100', fontWeight: 900, fontSize: 18 }}>M</span>
          <span style={{ fontWeight: 800, fontSize: 20 }}>MrBen</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>MrBen is not available in {where}</h1>
        <p style={{ color: '#9aa4b2', fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>
          Because of licensing and local regulations, we are not able to offer our services to players in {where}. We are sorry for the inconvenience.
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
          If you believe you are seeing this in error, or you are travelling, contact <a href="mailto:support@mrben.com" style={{ color: '#F5B301' }}>support@mrben.com</a>.
        </p>
        <div style={{ marginTop: 24, color: '#6b7280', fontSize: 12 }}>18+ · Play responsibly · MrBen is operated under an Anjouan gaming licence.</div>
      </div>
    </div>
  )
}
