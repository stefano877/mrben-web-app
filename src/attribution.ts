// Acquisition attribution. Captured once on first landing (first-touch wins,
// never overwritten), persisted across the session and a multi-step signup, and
// submitted at registration. Shape matches the backend's Attribution (§11.0 /
// MRB-59). Getting this wrong makes the first cohort permanently unattributable.

export interface Attribution {
  clickId?: string
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
  referrer?: string
  landingPage?: string
}

const KEY = 'mrben.attribution.v1'
const cap = (s: string | null | undefined, max: number) => (s ? s.slice(0, max) : undefined)

/** Read the landing URL once and store first-touch. No-op if we already have it. */
export function captureAttribution(): void {
  try {
    if (localStorage.getItem(KEY)) return // first touch wins
    const p = new URLSearchParams(window.location.search)
    const firstOf = (...keys: string[]) => { for (const k of keys) { const v = p.get(k); if (v) return v } return null }

    const a: Attribution = {
      clickId: cap(firstOf('clickid', 'click_id', 'gclid', 'fbclid', 'msclkid', 'ttclid'), 255),
      source: cap(p.get('utm_source'), 255),
      medium: cap(p.get('utm_medium'), 255),
      campaign: cap(p.get('utm_campaign'), 255),
      term: cap(p.get('utm_term'), 255),
      content: cap(p.get('utm_content'), 255),
      referrer: cap(document.referrer, 2048),
      landingPage: cap(window.location.href, 2048),
    }
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch { /* ignore */ }
}

/** The stored first-touch attribution, cleaned of empty fields, or undefined. */
export function getAttribution(): Attribution | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Attribution = {}
    for (const k of ['clickId', 'source', 'medium', 'campaign', 'term', 'content', 'referrer', 'landingPage'] as const) {
      const v = parsed[k]
      if (typeof v === 'string' && v.trim()) out[k] = v
    }
    return Object.keys(out).length ? out : undefined
  } catch { return undefined }
}
