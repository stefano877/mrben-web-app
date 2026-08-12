export interface Game {
  name: string
  studio: string
  grad: [string, string]
  ic: string
  cat: string
  pick?: boolean
  badge?: string
  badgeC?: string
  jackBase?: number
  img?: string
}

export interface Section {
  id: string
  title: string
  games: Game[]
}

export interface Promo {
  tag: string
  h: string
  big: string
  p: string
  g: [string, string]
  key: string
  cta: string
}

const studios = ['Pragmatic Play', 'NetEnt', 'Play’n GO', 'Evolution', 'Hacksaw', 'Nolimit City', 'BGaming']
const grads: [string, string][] = [
  ['#7B2FF7', '#F107A3'], ['#00C6FF', '#0072FF'], ['#F7971E', '#FFD200'], ['#FF512F', '#DD2476'],
  ['#11998E', '#38EF7D'], ['#FC466B', '#3F5EFB'], ['#F00000', '#DC281E'], ['#654EA3', '#EAAFC8'],
  ['#0F2027', '#2C5364'], ['#8E2DE2', '#4A00E0'], ['#FFB75E', '#ED8F03'], ['#1D976C', '#93F9B9'],
]
const icons = ['🍒', '🐺', '🍬', '⚡', '📖', '💎', '🐟', '👑', '🔥', '🐉', '⭐', '🎯', '🍀', '🦁', '🌈', '🍭']

function mk(names: string[]): Game[] {
  return names.map((n, i) => ({
    name: n,
    studio: studios[i % studios.length],
    grad: grads[(i * 3 + n.length) % grads.length],
    ic: icons[(i + n.length) % icons.length],
    cat: 'Slots',
  }))
}

export const jackpots: Game[] = mk(['Candy Combo', '333 Fat Frogs', '5 Wild Buffalo', 'Meerkat Mayhem', 'Aztec Inferno', 'Jackpot King', 'Divine Fortune', 'Mega Moolah'])
  .map((g, i) => ({ ...g, cat: 'Jackpots', jackBase: [1502334, 1498120, 2004551, 6431, 1500880, 2711009, 884320, 4102776][i] }))
export const popular: Game[] = mk(['Big Bass Bonanza', 'Wolf Gold', 'Sugar Rush', 'Gates of Olympus', 'Book of Dead', 'Starburst', 'Sweet Bonanza', 'Money Train 3', 'Reactoonz'])
export const bens: Game[] = mk(['Ben’s Gold Rush', 'Top Hat Riches', 'Gentleman’s Vault', 'Ben’s Lucky 7', 'Cap & Cash', 'Bowtie Bonanza']).map(g => ({ ...g, pick: true }))
export const live: Game[] = mk(['Lightning Roulette', 'Crazy Time', 'Blackjack VIP', 'Baccarat Live', 'Mega Wheel', 'Monopoly Live']).map(g => ({ ...g, cat: 'Live Casino', badge: 'LIVE', badgeC: '#E23B3B' }))
export const fresh: Game[] = mk(['Neon Nights', 'Star Blaster', 'Pirate’s Bounty', 'Mystic Fortune', 'Dragon’s Hoard', 'Fruit Fiesta']).map(g => ({ ...g, cat: 'New', badge: 'NEW', badgeC: '#0A8D3A' }))

export const allGames: Game[] = [...bens, ...jackpots, ...popular, ...live, ...fresh]

export const sectionDefs: Section[] = [
  { id: 'bens', title: 'Best Games — Ben’s Picks', games: bens },
  { id: 'jackpots', title: 'Jackpot Games', games: jackpots },
  { id: 'popular', title: 'Popular', games: popular },
  { id: 'live', title: 'Live Casino', games: live },
  { id: 'new', title: 'New Games', games: fresh },
]

export const providers = ['METAWIN', 'GLADIATOR', 'PRAGMATIC', 'EVOLUTION', 'B|GAMING', 'NOLIMIT|CITY', 'HACKSAW', 'BULLSHARK', 'NETENT', 'PLAY’N GO']

export interface Category { n: string; icon: string }
export const categories: Category[] = [
  { n: 'Slots', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8.5 4v16M15.5 4v16"/>' },
  { n: 'Live Casino', icon: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>' },
  { n: 'Casino Games', icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/>' },
  { n: 'Jackpots', icon: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v6c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 13v3c0 1.7 3.1 3 7 3s7-1.3 7-3v-3"/>' },
  { n: 'New', icon: '<path d="M12 3l2.2 6.2L20.5 11l-6.3 1.8L12 19l-2.2-6.2L3.5 11l6.3-1.8z"/>' },
  { n: 'Crash', icon: '<path d="M5 15c-1 3 0 4 0 4s1 1 4 0M14 4c3.5 0 6 2.5 6 6-2 5-8 8-8 8s-3-6 2-14z"/><circle cx="14.5" cy="9.5" r="1.6"/>' },
  { n: 'Providers', icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' },
]

export const promos: Promo[] = [
  { tag: 'Casino', h: 'Welcome offer', big: '100% + 50 FS', p: 'Match up to €200 plus 50 free spins on your first deposit.', g: ['#7A2BD0', '#3B1275'], key: 'casino', cta: 'Claim bonus' },
  { tag: 'Sports', h: 'Welcome offer', big: 'BET €10 GET €30', p: 'Bet €10 and get €30 in free bets. New players.', g: ['#2A6BE0', '#0E2E77'], key: 'sports', cta: 'Bet now' },
  { tag: 'Casino', h: 'Monthly', big: '€1,000,000', p: 'Win your share every month — six daily ways to win.', g: ['#8A3FE0', '#4A1690'], key: 'trophy', cta: 'Opt in' },
  { tag: 'Casino', h: 'Daily race', big: '€15,000', p: 'Race to the top for your share of €15k every day.', g: ['#E0A21E', '#7A4A05'], key: 'flag', cta: 'Join race' },
]

export const eur = (n: number) => '€' + n.toLocaleString('en-US')
export const fmt = (n: number) => '€' + n.toFixed(2)

/* ---- Offers page ---- */
export interface Offer { tag: string; key: string; title: string; short: string; details: string; terms: string }
export const OHERO: Record<string, [string, string]> = {
  sports: ['#2A6BE0', '#0E2E77'], trophy: ['#7A2BD0', '#3B1275'], coin: ['#F5A524', '#7A3E05'], casino: ['#FF7A1A', '#B23000'],
  chest: ['#B24CE0', '#3D1268'], gem: ['#22B8FF', '#0A3A8A'], star: ['#FF5EA0', '#7A1E5A'], flag: ['#E0A21E', '#7A4A05'],
}
export const offers: Offer[] = [
  { tag: 'Sports', key: 'sports', title: 'Bet €10, Get €50 Free Bet', short: 'Bet €10 on any Mr Ben Sport market and get a €50 Free Bet once your bet settles, win or lose.', details: '<p><b>How it works</b></p><p>Place a qualifying €10 bet at Mr Ben Sport. Once it settles, win or lose, a €50 Free Bet lands in your account. Use it on any market in a single transaction.</p>', terms: '18+. New players only. Opt-in required. Min dep €10.' },
  { tag: 'Casino', key: 'trophy', title: 'MrBen Welcome Offer 2026', short: 'Your first three deposits get supercharged, up to €1,300 in bonuses plus 150 bonus spins.', details: '<p>🔥 <b>1st deposit:</b> 300% match up to €300 + 50 spins</p><p>💫 <b>2nd deposit:</b> 40% match up to €500 + 50 spins</p><p>🚀 <b>3rd deposit:</b> 60% match up to €500 + 50 spins</p><p>🏆 <b>Total:</b> €1,300 bonus money + 150 bonus spins</p>', terms: '18+. New players only. Terms apply.' },
  { tag: 'VIP', key: 'coin', title: 'Ben’s Loyalty Program', short: 'Every spin and every hand earns loyalty points that unlock seriously rewarding perks.', details: '<p>Join the Mr Ben Loyalty Club. Rack up points on slots and table games, climb the tiers and unlock cashback, faster withdrawals and a personal host.</p>', terms: '18+. Funded players only. Terms apply.' },
  { tag: 'Casino', key: 'casino', title: 'Monday Spin Boost', short: 'Every Monday, deposit up to €100 and receive triple the spins.', details: '<p><b>How it works</b></p><p>Deposit €100 on a Monday and get 300 bonus spins, triple the fun to start your week.</p>', terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'chest', title: 'Tuesday Spin Boost', short: 'Get up to 300 free spins on Book of Dead every Tuesday.', details: '<p><b>How it works</b></p><p>Deposit €100 for 100 spins, or €300 for 300 spins, all on Book of Dead.</p>', terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'gem', title: 'Thursday Treat', short: 'Shine bright on Thursdays with up to 300 spins on Starburst.', details: '<p><b>How it works</b></p><p>Deposit €100 for 100 spins, or €300 for 300 spins, all on Starburst.</p>', terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'star', title: 'Sunday Funday', short: 'Wrap up your week with up to 300 spins on Big Bass Bonanza.', details: '<p><b>How it works</b></p><p>Deposit €100 for 100 spins, or €300 for 300 spins, all on Big Bass Bonanza.</p>', terms: '18+. Existing players only.' },
]
export const offerTabs = ['All', 'Casino', 'Sports', 'VIP']

/* ---- Sportsbook ---- */
export interface Match { league: string; time?: string; live?: boolean; a: string; b: string; o: [string, string, string] }
export const sportsData: Match[] = [
  { league: '⚽ Premier League', time: 'Today 20:45', a: 'Arsenal', b: 'Chelsea', o: ['2.10', '3.40', '3.25'] },
  { league: '⚽ La Liga', time: 'Today 21:00', a: 'Real Madrid', b: 'Sevilla', o: ['1.55', '4.20', '5.50'] },
  { league: '⚽ Champions League', time: 'Wed 21:00', a: 'Man City', b: 'Bayern', o: ['2.05', '3.60', '3.30'] },
  { league: '🎾 ATP Finals', live: true, a: 'Alcaraz', b: 'Sinner', o: ['1.72', '—', '2.05'] },
  { league: '🏀 NBA', time: 'Tonight 01:30', a: 'Lakers', b: 'Celtics', o: ['1.90', '—', '1.95'] },
  { league: '⚽ Serie A', time: 'Tomorrow 18:00', a: 'Juventus', b: 'Napoli', o: ['2.45', '3.10', '2.90'] },
  { league: '⚽ Bundesliga', time: 'Sat 15:30', a: 'Dortmund', b: 'Leipzig', o: ['2.20', '3.50', '2.95'] },
  { league: '🏈 NFL', time: 'Sun 22:00', a: 'Chiefs', b: 'Bills', o: ['1.80', '—', '2.05'] },
]

/* ---- VIP ---- */
export interface Tier { n: string; pts: number; ic: string; c: string }
export const vipTiers: Tier[] = [
  { n: 'Bronze', pts: 0, ic: '🥉', c: '#B87333' },
  { n: 'Silver', pts: 1000, ic: '🥈', c: '#9AA6B2' },
  { n: 'Gold', pts: 2500, ic: '🥇', c: '#E9A82E' },
  { n: 'Platinum', pts: 6000, ic: '💠', c: '#5E8FB0' },
  { n: 'Ben’s Circle', pts: 12000, ic: '🎩', c: '#7A2BD0' },
]
export const vipPerks: [string, string, string][] = [
  ['💸', 'Weekly cashback', 'Up to 15% back on net losses'],
  ['⚡', 'Faster withdrawals', 'Priority payout queue'],
  ['🎁', 'Birthday bonus', 'A gift on your special day'],
  ['👤', 'Personal host', 'Dedicated VIP manager'],
  ['🎟️', 'Exclusive tournaments', 'VIP-only prize pools'],
  ['📈', 'Higher limits', 'Raised deposit and bet limits'],
]
export const CHEST = ['€15 bonus', '25 free spins', '€40 bonus', '100 free spins', '€10 bonus']
