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
const icons = ['A', 'K', 'Q', 'J', '10', '7', '9', '8', 'A', 'K', 'Q', 'J', '10', '7', '9', '8']

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

export const providers = ['Pragmatic Play', 'Evolution', 'NetEnt', 'Play’n GO', 'Hacksaw Gaming', 'Nolimit City', 'BGaming', 'Push Gaming', 'Relax Gaming', 'Big Time Gaming']

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
// Money amounts are written as {tokens} (e.g. {minDepW}, {cap1}) and localised at
// render time from the fixed-value currency grid in currency.ts — so a BRL account
// sees R$ values, a NOK account sees kr, etc., all from the same source copy.
export interface OfferFact { label: string; value: string }
// hero = the one big headline value (localised via {tokens}); heroSub = the line under it.
export interface Offer { tag: string; key: string; title: string; ribbon?: string; hero: string; heroSub: string; short: string; facts: OfferFact[]; details: string; terms: string }
export const OHERO: Record<string, [string, string]> = {
  sports: ['#2A6BE0', '#0E2E77'], trophy: ['#7A2BD0', '#3B1275'], coin: ['#F5A524', '#7A3E05'], casino: ['#FF7A1A', '#B23000'],
  chest: ['#B24CE0', '#3D1268'], gem: ['#22B8FF', '#0A3A8A'], star: ['#FF5EA0', '#7A1E5A'], flag: ['#E0A21E', '#7A4A05'],
}
const SPINDAY = (day: string, game: string) => `<p><b>How it works</b></p><p>Make your first deposit of the day and we boost your free spins on <b>${game}</b> in proportion to your deposit — up to <b>300 bonus spins</b>. ${day} only.</p>
<p><b>Eligibility</b></p><ul><li>18+, existing funded players who have opted in</li><li>First successful deposit of the day (00:01–23:59 CET); one per account</li></ul>
<p><b>Key terms</b></p><ul><li>Min deposit {minDepS}</li><li>Spin winnings credited as bonus funds, capped at {fsCap}</li><li>Wagering 45× the bonus funds (bonus funds only)</li><li>Max bet {maxBet} while the bonus is in play</li><li>Bonus spins valid 10 days; unused bonus funds expire after 30 days</li></ul>
<p><small>Full Promotional and General Terms apply. Please play responsibly.</small></p>`
const SPINFACTS: OfferFact[] = [
  { label: 'Free spins', value: 'Up to 300' }, { label: 'Min deposit', value: '{minDepS}' },
  { label: 'Wagering', value: '45×' }, { label: 'Max bet', value: '{maxBet}' },
]

export const offers: Offer[] = [
  { tag: 'Sports', key: 'sports', title: 'Bet {minDepW}, Get {sportsFreeBet} Free Bet', ribbon: 'Sportsbook', hero: '{sportsFreeBet}', heroSub: 'Free Bet — win or lose', short: 'Bet {minDepW} on any Mr Ben Sport market and get a {sportsFreeBet} Free Bet once your bet settles — win or lose.',
    facts: [ { label: 'Free bet', value: '{sportsFreeBet}' }, { label: 'Min odds', value: '2.00' }, { label: 'Wagering', value: '10×' }, { label: 'Max win', value: '{sportsMax}' } ],
    details: `<p><b>How it works</b></p><p>Bet {minDepW} on any Mr Ben Sport market at odds of 2.00 or higher. Once your qualifying bet settles — win or lose — a {sportsFreeBet} Free Bet is credited to your account. Use it on any market in a single transaction.</p>
<p><b>Eligibility</b></p><ul><li>18+, new players, not resident in Great Britain</li><li>Registered, verified account, opted in</li><li>No other active bonus when you claim</li></ul>
<p><b>Key terms</b></p><ul><li>Min deposit {minDepW}. Skrill / Neteller not eligible</li><li>Qualify by wagering {minDepW} at odds ≥ 2.00 (cumulative or single)</li><li>Free Bet expires 7 days after being credited</li><li>Winnings credited as bonus funds; wagering 10× (bonus funds only, min odds 2.00)</li><li>Maximum winnings from bonus funds: {sportsMax}. Minimum withdrawal: {minWd}</li></ul>
<p><small>Full Promotional and General Terms apply. Please play responsibly.</small></p>`, terms: '18+. New players only. Opt-in required. Min dep {minDepW}.' },
  { tag: 'Casino', key: 'trophy', title: 'MrBen Welcome Offer 2026', ribbon: 'Most popular', hero: '{welcomeTotal}', heroSub: '+ 150 bonus spins', short: 'Your first three deposits get supercharged — up to {welcomeTotal} in bonuses plus 150 bonus spins.',
    facts: [ { label: 'Match', value: 'Up to 300%' }, { label: 'Total bonus', value: 'Up to {welcomeTotal}' }, { label: 'Bonus spins', value: '150' }, { label: 'Wagering', value: '55×' } ],
    details: `<p><b>Your first three deposits, boosted</b></p><ul><li><b>1st deposit:</b> 300% match up to {cap1} + 50 bonus spins</li><li><b>2nd deposit:</b> 40% match up to {cap23} + 50 bonus spins</li><li><b>3rd deposit:</b> 60% match up to {cap23} + 50 bonus spins</li></ul><p>Up to <b>{welcomeTotal}</b> in bonuses + 150 bonus spins.</p>
<p><b>Key terms</b></p><ul><li>New players only, one per account. Min {minDepW} per deposit; opt in via the cashier</li><li>Not combinable with other offers. Skrill / Neteller not eligible</li><li>Bonus spins on any Pragmatic Play game; spin winnings capped at {fsCap}</li><li>Wagering 55× of (bonus + deposit + spins)</li><li>Max bet {maxBet} while a bonus is in play</li><li>Spins valid 10 days; unused bonus funds expire after 30 days</li></ul>
<p><small>Full Promotional and General Terms apply. Please play responsibly.</small></p>`, terms: '18+. New players only. Terms apply.' },
  { tag: 'VIP', key: 'coin', title: 'Ben’s Loyalty Program', ribbon: 'VIP', hero: '2× pts', heroSub: 'on every slot spin', short: 'Every spin and every hand earns loyalty points that unlock seriously rewarding perks.',
    facts: [ { label: '1,000 points', value: '{loyalty}' }, { label: 'Signup bonus', value: '500 pts' }, { label: 'Wagering', value: '40×' }, { label: 'Cash-out', value: 'No max' } ],
    details: `<p><b>Earn as you play</b></p><p>Collect loyalty points on slots and table games and redeem them for bonus funds in <b>My Account</b>. Points earned per {minDepS} wagered:</p>
<ul><li>Slots &amp; Scratchcards — 2.00 pts</li><li>Video Poker &amp; Bingo — 1.00 pt</li><li>Blackjack — 0.50 pt</li><li>Roulette — 0.25 pt</li></ul>
<p>Plus 500 points after your first deposit.</p>
<p><b>Redeeming</b></p><ul><li>1,000 points = {loyalty} in bonus funds</li><li>Redeem in batches of 1,000 (min 1,000/day, max 10,000/day)</li><li>Bonus funds wagering 40×; valid 30 days; no maximum cash-out</li></ul>
<p><small>Existing funded players only. Full terms apply. Please play responsibly.</small></p>`, terms: '18+. Funded players only. Terms apply.' },
  { tag: 'Casino', key: 'casino', title: 'Monday Spin Boost', ribbon: 'Weekly', hero: '300', heroSub: 'free spins, every Monday', short: 'Start the week right — deposit on Monday and receive triple the spins on Starburst.', facts: SPINFACTS, details: SPINDAY('Monday', 'Starburst'), terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'chest', title: 'Tuesday Spin Boost', ribbon: 'Weekly', hero: '300', heroSub: 'free spins, every Tuesday', short: 'Get up to 300 free spins on Book of Dead every Tuesday.', facts: SPINFACTS, details: SPINDAY('Tuesday', 'Book of Dead'), terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'gem', title: 'Thursday Treat', ribbon: 'Weekly', hero: '300', heroSub: 'free spins, every Thursday', short: 'Shine bright on Thursdays with up to 300 spins on Starburst.', facts: SPINFACTS, details: SPINDAY('Thursday', 'Starburst'), terms: '18+. Existing players only.' },
  { tag: 'Casino', key: 'star', title: 'Sunday Funday', ribbon: 'Weekly', hero: '300', heroSub: 'free spins, every Sunday', short: 'Wrap up your week with up to 300 spins on Big Bass Bonanza.', facts: SPINFACTS, details: SPINDAY('Sunday', 'Big Bass Bonanza 1000'), terms: '18+. Existing players only.' },
]
export const offerTabs = ['All', 'Casino', 'Sports', 'VIP']

/* ---- Sportsbook ---- */
export interface Match { league: string; time?: string; live?: boolean; a: string; b: string; o: [string, string, string] }
export const sportsData: Match[] = [
  { league: 'Premier League', time: 'Today 20:45', a: 'Arsenal', b: 'Chelsea', o: ['2.10', '3.40', '3.25'] },
  { league: 'La Liga', time: 'Today 21:00', a: 'Real Madrid', b: 'Sevilla', o: ['1.55', '4.20', '5.50'] },
  { league: 'Champions League', time: 'Wed 21:00', a: 'Man City', b: 'Bayern', o: ['2.05', '3.60', '3.30'] },
  { league: 'ATP Finals', live: true, a: 'Alcaraz', b: 'Sinner', o: ['1.72', '—', '2.05'] },
  { league: 'NBA', time: 'Tonight 01:30', a: 'Lakers', b: 'Celtics', o: ['1.90', '—', '1.95'] },
  { league: 'Serie A', time: 'Tomorrow 18:00', a: 'Juventus', b: 'Napoli', o: ['2.45', '3.10', '2.90'] },
  { league: 'Bundesliga', time: 'Sat 15:30', a: 'Dortmund', b: 'Leipzig', o: ['2.20', '3.50', '2.95'] },
  { league: 'NFL', time: 'Sun 22:00', a: 'Chiefs', b: 'Bills', o: ['1.80', '—', '2.05'] },
]

/* ---- VIP ---- */
export interface Tier { n: string; pts: number; ic: string; c: string }
export const vipTiers: Tier[] = [
  { n: 'Bronze', pts: 0, ic: '', c: '#B87333' },
  { n: 'Silver', pts: 1000, ic: '', c: '#9AA6B2' },
  { n: 'Gold', pts: 2500, ic: '', c: '#E9A82E' },
  { n: 'Platinum', pts: 6000, ic: '', c: '#5E8FB0' },
  { n: 'Ben’s Circle', pts: 12000, ic: '', c: '#7A2BD0' },
]
export const vipPerks: [string, string, string][] = [
  ['', 'Weekly cashback', 'Up to 15% back on net losses'],
  ['', 'Faster withdrawals', 'Priority payout queue'],
  ['', 'Birthday bonus', 'A gift on your special day'],
  ['', 'Personal host', 'Dedicated VIP manager'],
  ['', 'Exclusive tournaments', 'VIP-only prize pools'],
  ['', 'Higher limits', 'Raised deposit and bet limits'],
]
export const CHEST = ['€15 bonus', '25 free spins', '€40 bonus', '100 free spins', '€10 bonus']

/* ---- Daily bonus wheel ---- */
export interface WheelSlice { t: string; c: string }
export const WHEEL: WheelSlice[] = [
  { t: '10 FS', c: '#FF7A1A' }, { t: '€5', c: '#5A2A8F' }, { t: '25 FS', c: '#2A6BE0' }, { t: '€10', c: '#E0A21E' },
  { t: '50 FS', c: '#12B39A' }, { t: '€20', c: '#E85D9A' }, { t: 'Try again', c: '#3a4060' }, { t: '€50', c: '#B23000' },
]
