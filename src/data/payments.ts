// Player-facing payment methods + deposit bonuses for the cashier (MRB-61).
//
// In the real app this comes from GET /v1/payments/methods, filtered by the
// player's country/capabilities — never a hard-coded list (MRB-61 R1). Until
// that endpoint lands, this local table stands in; the cashier reads it exactly
// as it will read the API response, so swapping is a data-source change only.

export type PayKind = 'crypto' | 'card' | 'local'

export interface DepositMethod {
  k: string
  type: PayKind
  label: string
  sub: string
  color: string
  min: number
  max: number
  feePct: number
  timing: string     // shown on the pending state (MRB-61 R3)
  regions: string
}

export interface WithdrawMethod {
  k: string
  type: PayKind
  label: string
  sub: string
  color: string
  min: number
  max: number
  timing: string
}

// A crypto asset a player can deposit. Network is the highest-risk field on the
// screen (MRB-61 R8): a wrong-network send is unrecoverable, so it is stated
// prominently everywhere the address appears. Addresses here are sample values.
export interface CryptoAsset {
  coin: string
  network: string
  address: string
  minConf: number
  color: string
}

export const cryptoAssets: CryptoAsset[] = [
  { coin: 'BTC', network: 'Bitcoin', address: 'bc1qsampleaddr0mrben9xh7k3l2m8w4v6q0s5t7u9', minConf: 2, color: '#F7931A' },
  { coin: 'USDT', network: 'Tron (TRC-20)', address: 'TSampleMrBenUSDTaddr9Xh7K3L2m8W4v6Q0s5T7u9', minConf: 1, color: '#26A17B' },
  { coin: 'ETH', network: 'Ethereum (ERC-20)', address: '0xSAMPLEmrben3a9f7c2e1b8d4a6c0f5e9b2d7c4a1e', minConf: 12, color: '#627EEA' },
]

export const depositMethods: DepositMethod[] = [
  { k: 'crypto', type: 'crypto', label: 'Crypto', sub: 'BTC · USDT · ETH · instant', color: '#F7931A', min: 10, max: 50000, feePct: 0, timing: 'Credited after network confirmations — usually a few minutes.', regions: 'Global' },
  { k: 'card', type: 'card', label: 'Card', sub: 'Visa · Mastercard', color: '#2E6FDE', min: 20, max: 5000, feePct: 0, timing: 'Usually instant. If your bank flags it for review it can take a few minutes.', regions: 'EU · LATAM' },
  { k: 'local', type: 'local', label: 'Local rails (D24)', sub: 'Bank transfer · vouchers', color: '#0FA36B', min: 10, max: 10000, feePct: 0, timing: 'Local rails can take from a few minutes up to a few hours to clear.', regions: 'LATAM · Africa · Asia' },
]

export const withdrawMethods: WithdrawMethod[] = [
  { k: 'crypto', type: 'crypto', label: 'Crypto payout', sub: 'To your wallet address', color: '#F7931A', min: 20, max: 50000, timing: 'Sent after approval — typically within the hour once verified.' },
  { k: 'local', type: 'local', label: 'Local bank (D24)', sub: 'Bank transfer', color: '#0FA36B', min: 20, max: 10000, timing: '1–2 business days after approval.' },
]

// Deposit bonuses whose terms must be shown inline before confirming (MRB-61 R2).
export interface DepositBonus {
  id: string
  name: string
  matchPct: number
  maxBonus: number
  minDeposit: number
  wagering: number     // x
  expiryDays: number
  maxBet: number       // € cap on bet while a bonus is active
  excluded: string     // excluded game types
  firstOnly: boolean
}

export const depositBonuses: DepositBonus[] = [
  { id: 'welcome', name: 'Welcome — 100% up to €200', matchPct: 100, maxBonus: 200, minDeposit: 20, wagering: 35, expiryDays: 30, maxBet: 5, excluded: 'Live Casino & Table Games', firstOnly: true },
  { id: 'reload', name: 'Reload — 50% up to €150', matchPct: 50, maxBonus: 150, minDeposit: 30, wagering: 30, expiryDays: 14, maxBet: 5, excluded: 'Live Casino & Table Games', firstOnly: false },
]

// The bonus a deposit of this size on this offer would grant.
export function bonusGrant(b: DepositBonus, deposit: number): number {
  if (deposit < b.minDeposit) return 0
  return Math.min(b.maxBonus, Math.round(deposit * (b.matchPct / 100)))
}
