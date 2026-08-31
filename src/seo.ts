// Per-page SEO (MRB-96). OpenGraph/Twitter defaults live in index.html; here we
// keep the document title, description, canonical and og:url accurate as the SPA
// navigates. Safe to call anywhere; never throws.

const SITE = 'MrBen'
const BASE = (import.meta.env.VITE_SITE_URL?.trim() || 'https://mrben.com').replace(/\/$/, '')

interface Meta { title: string; desc: string }

const PAGE_META: Record<string, Meta> = {
  lobby: {
    title: 'MrBen Casino — Slots, Live Casino & Big Bonuses',
    desc: 'Play hundreds of slots and live casino games at MrBen. Fast payouts, crypto and card deposits, and a 100% welcome bonus up to €200. 18+. Play responsibly.',
  },
  offers: {
    title: 'Casino Promotions & Bonuses | MrBen',
    desc: 'Claim the MrBen welcome bonus, free spins and weekly reloads. Promotions for new and existing players. 18+. Terms apply.',
  },
  sports: {
    title: 'Sports Betting | MrBen',
    desc: 'Bet on football and more at MrBen Sport, with competitive odds and fast settlement. 18+. Play responsibly.',
  },
  vip: {
    title: 'VIP & Loyalty Rewards | MrBen',
    desc: 'Earn loyalty points on every spin and hand, climb the VIP tiers and unlock cashback, faster withdrawals and a personal host at MrBen.',
  },
}

export function applySeo(page: string, opts?: { legalTitle?: string; legalKey?: string }): void {
  if (typeof document === 'undefined') return
  try {
    let meta: Meta
    let path: string
    if (page === 'legal' && opts?.legalTitle) {
      meta = {
        title: `${opts.legalTitle} | ${SITE}`,
        desc: `${opts.legalTitle} for MrBen. 18+. Play responsibly.`,
      }
      path = `/?legal=${opts.legalKey ?? ''}`
    } else {
      meta = PAGE_META[page] ?? PAGE_META.lobby
      path = page === 'lobby' ? '/' : `/?page=${page}`
    }
    document.title = meta.title
    setMeta('name', 'description', meta.desc)
    setMeta('property', 'og:title', meta.title)
    setMeta('property', 'og:description', meta.desc)
    setMeta('property', 'og:url', BASE + path)
    setCanonical(BASE + path)
  } catch { /* ignore */ }
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el) }
  el.href = href
}
