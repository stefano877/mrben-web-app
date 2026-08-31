// Consent-gated marketing/analytics tags (MRB-96). Nothing loads until the
// player accepts "all" cookies AND an ID is configured, so with no IDs set this
// is a complete no-op. Set VITE_GA_ID and/or VITE_META_PIXEL_ID (Vercel env) to
// arm GA4 and the Meta pixel. This is separate from the first-party funnel
// analytics in analytics.ts, which carries no third-party cookies.

const GA_ID = import.meta.env.VITE_GA_ID?.trim() || ''
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() || ''
const CONSENT_KEY = 'mrben.cookie.v1'

let loaded = false

export function hasMarketingConsent(): boolean {
  try { return localStorage.getItem(CONSENT_KEY) === 'all' } catch { return false }
}

// Inject the configured tags once, but only with consent and only if armed.
export function loadMarketingTags(): void {
  if (loaded || typeof document === 'undefined') return
  if (!hasMarketingConsent()) return
  if (!GA_ID && !PIXEL_ID) return
  loaded = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any

  if (GA_ID) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(s)
    w.dataLayer = w.dataLayer || []
    w.gtag = function gtag() { w.dataLayer.push(arguments) }
    w.gtag('js', new Date())
    w.gtag('config', GA_ID, { anonymize_ip: true })
  }

  if (PIXEL_ID) {
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    const fbq = function fbq() { (fbq as any).queue.push(arguments) }
    ;(fbq as any).queue = []
    ;(fbq as any).loaded = true
    ;(fbq as any).version = '2.0'
    w.fbq = w._fbq = fbq
    w.fbq('init', PIXEL_ID)
    w.fbq('track', 'PageView')
  }
}
