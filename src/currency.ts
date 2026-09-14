// Currency localisation for the player site.
//
// We use FIXED per-currency values (not live FX): each named amount has a hand-set
// value per supported currency, matching the licensed promo terms. Crypto plays
// under the USD column (stablecoins 1:1), so we surface fiat here and treat crypto
// as a deposit rail rather than a display currency.
//
// The real per-player currency comes from the account (SoftGamings wallet) once the
// backend is wired. Until then we default from the browser locale and let the player
// pick from the header selector; the display logic is identical either way.

export type Ccy = 'EUR' | 'USD' | 'CAD' | 'BRL' | 'NOK'

export interface CcyMeta { code: Ccy; symbol: string; label: string; flag: string }

export const CCYS: CcyMeta[] = [
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone', flag: '🇳🇴' },
]

// The fixed-value grid — one row per named amount, one column per currency.
// Source of truth: mrben-offers.json (the licensed promo terms).
const GRID: Record<string, Record<Ccy, number>> = {
  minDepW:       { EUR: 10,  USD: 10,  CAD: 15,  BRL: 50,   NOK: 100 },   // welcome / sports min deposit + qualifying bet
  minDepS:       { EUR: 20,  USD: 20,  CAD: 30,  BRL: 100,  NOK: 200 },   // spin-boost min deposit
  maxBet:        { EUR: 5,   USD: 5,   CAD: 8,   BRL: 25,   NOK: 50 },    // max bet while a bonus is in play
  fsCap:         { EUR: 100, USD: 100, CAD: 150, BRL: 500,  NOK: 1000 },  // free-spin winnings cap
  sportsFreeBet: { EUR: 50,  USD: 50,  CAD: 75,  BRL: 250,  NOK: 500 },   // sports free bet amount
  sportsMax:     { EUR: 300, USD: 300, CAD: 450, BRL: 1500, NOK: 3000 },  // max win from sports bonus funds
  cap1:          { EUR: 300, USD: 300, CAD: 450, BRL: 1500, NOK: 3000 },  // welcome deposit 1 cap
  cap23:         { EUR: 500, USD: 500, CAD: 750, BRL: 2500, NOK: 5000 },  // welcome deposit 2 & 3 cap
  loyalty:       { EUR: 5,   USD: 5,   CAD: 8,   BRL: 25,   NOK: 50 },    // 1,000 loyalty points = this
  minWd:         { EUR: 10,  USD: 10,  CAD: 15,  BRL: 50,   NOK: 100 },   // minimum withdrawal
}
// Welcome total = deposit-1 cap + deposit-2 cap + deposit-3 cap.
function welcomeTotal(c: Ccy) { return GRID.cap1[c] + GRID.cap23[c] * 2 }

function group(n: number, sep: string): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

// Format a raw number in the given currency with the right symbol + separators.
export function fmt(n: number, c: Ccy): string {
  switch (c) {
    case 'EUR': return '€' + group(n, ',')
    case 'USD': return '$' + group(n, ',')
    case 'CAD': return 'C$' + group(n, ',')
    case 'BRL': return 'R$' + group(n, '.')
    case 'NOK': return group(n, ' ') + ' kr'
  }
}

// Look up a named grid amount, formatted for the currency.
export function amount(key: string, c: Ccy): string {
  if (key === 'welcomeTotal') return fmt(welcomeTotal(c), c)
  const row = GRID[key]
  return row ? fmt(row[c], c) : key
}

// Replace {token} placeholders in a string with the localised amount.
// e.g. loc('Min deposit {minDepW}', 'BRL') -> 'Min deposit R$50'
export function loc(s: string, c: Ccy): string {
  if (!s) return s
  return s.replace(/\{(\w+)\}/g, (_m, key) => amount(key, c))
}

const KEY = 'mrben.ccy'
const CODES = CCYS.map(x => x.code)

function fromLocale(): Ccy {
  try {
    const langs = [navigator.language, ...(navigator.languages || [])].map(l => (l || '').toLowerCase())
    for (const l of langs) {
      if (l.includes('pt-br') || l === 'pt') return 'BRL'
      if (l.includes('-no') || l.startsWith('nb') || l.startsWith('nn') || l === 'no') return 'NOK'
      if (l.includes('-ca')) return 'CAD'
      if (l.includes('-us')) return 'USD'
    }
  } catch { /* ignore */ }
  return 'EUR'
}

export function loadCcy(): Ccy {
  try {
    const saved = localStorage.getItem(KEY) as Ccy | null
    if (saved && CODES.includes(saved)) return saved
  } catch { /* ignore */ }
  return fromLocale()
}

export function saveCcy(c: Ccy) {
  try { localStorage.setItem(KEY, c) } catch { /* ignore */ }
}

export function ccyMeta(c: Ccy): CcyMeta {
  return CCYS.find(x => x.code === c) || CCYS[0]
}
