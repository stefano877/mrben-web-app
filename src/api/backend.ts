// Composite adapter for when VITE_API_BASE points at Willmer's backend.
//
// His backend currently implements ONLY auth + sessions. Wallet, games and RG
// do not exist yet (they wait on Carl's PAM deal), and freshly registered users
// come back walletReady:false. So this adapter:
//   • routes auth (register/login/logout/session) to the real backend, and
//   • keeps wallet/game/RG as LOCAL demo play, gated on walletReady.
//
// When the real wallet/game endpoints land, replace each play method here with a
// call to the backend — the store and UI above this seam do not change.

import type { MrBenApi } from './contract'
import {
  ApiError,
  type Account, type Session, type RegisterInput, type Txn, type TxnKind,
  type LimitKind, type DepositResult, type BetResult, type WheelResult,
  type ChestResult, type LimitResult,
} from './types'
import { createAuthClient, AuthError } from './auth/client'
import type { AuthenticatedUser } from './auth/types'
import { WHEEL, CHEST } from '../data'

// ---------------------------------------------------------------------------
// Local demo play-state (separate key from mock mode; only used with a backend)
// ---------------------------------------------------------------------------
const PLAY_KEY = 'mrben.play.v1'

interface PlayState {
  balance: number; bonus: number; points: number
  favs: string[]; recent: string[]; txns: Txn[]
  rc: boolean; excluded: boolean; wheelClaimed: boolean; chestClaimed: boolean; firstDepositDone: boolean
  limits: { deposit: number; loss: number; session: number }
  pending: { [K in LimitKind]?: { value: number; at: number } }
}

const freshPlay = (): PlayState => ({
  balance: 0, bonus: 0, points: 0, favs: [], recent: [], txns: [],
  rc: true, excluded: false, wheelClaimed: false, chestClaimed: false, firstDepositDone: false,
  limits: { deposit: 500, loss: 1000, session: 60 }, pending: {},
})

function createPlayStore() {
  let all: Record<string, PlayState> = {}
  try { const raw = localStorage.getItem(PLAY_KEY); if (raw) all = JSON.parse(raw) || {} } catch { all = {} }
  let seq = Math.max(0, ...Object.values(all).flatMap(p => (p.txns || []).map(t => t.id))) + 1

  const persist = () => { try { localStorage.setItem(PLAY_KEY, JSON.stringify(all)) } catch { /* ignore */ } }
  const mkTxn = (kind: TxnKind, amount: number, label: string): Txn => ({ id: seq++, kind, amount, label, at: Date.now() })

  const applyDue = (p: PlayState) => {
    let changed = false
    for (const k of ['deposit', 'loss', 'session'] as LimitKind[]) {
      const d = p.pending[k]
      if (d && d.at <= Date.now()) { p.limits[k] = d.value; delete p.pending[k]; changed = true }
    }
    return changed
  }

  const ensure = (email: string): PlayState => {
    if (!all[email]) { all[email] = freshPlay(); persist() }
    else if (applyDue(all[email])) persist()
    return all[email]
  }

  return { ensure, persist, mkTxn }
}

// ---------------------------------------------------------------------------
// Backend adapter
// ---------------------------------------------------------------------------
export function createBackendApi(apiBase: string): MrBenApi {
  const auth = createAuthClient(apiBase)
  const play = createPlayStore()
  let who: AuthenticatedUser | null = null

  const requireUser = (): AuthenticatedUser => {
    if (!who) throw new ApiError('unauthenticated', 'Please log in to continue')
    return who
  }

  // Merge backend identity with the local demo play-state into the Account the UI renders.
  const account = (): Account => {
    const u = requireUser()
    const p = play.ensure(u.email)
    return {
      email: u.email, username: u.username, country: u.country,
      dob: '', phone: '', dial: '', marketing: false,
      id: u.id, status: u.status, role: u.role, emailVerified: u.emailVerified, walletReady: u.walletReady,
      balance: p.balance, bonus: p.bonus, points: p.points,
      favs: p.favs, recent: p.recent, txns: p.txns,
      rc: p.rc, excluded: p.excluded, wheelClaimed: p.wheelClaimed, chestClaimed: p.chestClaimed,
      firstDepositDone: p.firstDepositDone, limits: p.limits, pending: p.pending,
    }
  }

  // Translate the auth client's AuthError into our ApiError so messages surface.
  async function viaAuth<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn() }
    catch (e) { throw e instanceof AuthError ? new ApiError(e.code, e.message) : e }
  }

  const toE164 = (phone: string) => '+' + phone.replace(/[^\d]/g, '')

  const walletGate = () => {
    const u = requireUser()
    if (u.walletReady === false) throw new ApiError('wallet_not_ready', 'Your wallet is being set up. Deposits open once it is ready.')
  }

  return {
    async getSession(): Promise<Session | null> {
      who = await auth.bootstrap()
      if (!who) return null
      play.ensure(who.email)
      return { token: auth.getAccessToken() ?? '', account: account() }
    },

    async register(input: RegisterInput): Promise<Session> {
      who = await viaAuth(() => auth.register({
        email: input.email,
        username: input.profile.username,
        password: input.pass,
        country: input.profile.country,
        dob: input.profile.dob,
        phone: toE164(input.profile.phone),
        marketing: input.profile.marketing,
      }))
      play.ensure(who.email)
      return { token: auth.getAccessToken() ?? '', account: account() }
    },

    async login(email: string, pass: string): Promise<Session> {
      who = await viaAuth(() => auth.login(email, pass))
      play.ensure(who.email)
      return { token: auth.getAccessToken() ?? '', account: account() }
    },

    async logout(): Promise<void> { try { await auth.logout() } finally { who = null } },

    async deposit(amount: number, method: string): Promise<DepositResult> {
      walletGate()
      const p = play.ensure(requireUser().email)
      if (!(amount > 0)) throw new ApiError('bad_amount', 'Enter an amount')
      let bonusAdded = 0
      if (!p.firstDepositDone) { bonusAdded = Math.min(200, amount); p.bonus += bonusAdded; p.firstDepositDone = true }
      p.balance += amount
      p.txns = [play.mkTxn('deposit', amount, `Deposit (${method})`), ...(bonusAdded ? [play.mkTxn('bonus', bonusAdded, 'Welcome bonus 100%')] : []), ...p.txns].slice(0, 60)
      play.persist()
      return { account: account(), bonusAdded }
    },

    async withdraw(amount: number, method: string): Promise<Account> {
      walletGate()
      const p = play.ensure(requireUser().email)
      if (!(amount > 0)) throw new ApiError('bad_amount', 'Enter an amount')
      if (amount > p.balance) throw new ApiError('insufficient', 'Amount exceeds balance')
      p.balance -= amount
      p.txns = [play.mkTxn('withdraw', amount, `Withdrawal (${method})`), ...p.txns].slice(0, 60)
      play.persist()
      return account()
    },

    async placeBet(_gameId: string, gameName: string, bet: number): Promise<BetResult> {
      const p = play.ensure(requireUser().email)
      if (p.excluded) throw new ApiError('excluded', 'Self-excluded. Play is blocked.')
      if (p.balance < bet) throw new ApiError('insufficient', 'Insufficient funds. Top up your wallet.')
      const win = Math.random() < 0.42 ? +(bet * (Math.random() * 4 + 1.5)).toFixed(2) : 0
      p.balance = p.balance - bet + win
      p.points += Math.round(bet)
      p.txns = [play.mkTxn('bet', bet, `Bet · ${gameName}`), ...(win > 0 ? [play.mkTxn('win', win, `Win · ${gameName}`)] : []), ...p.txns].slice(0, 60)
      play.persist()
      return { account: account(), win }
    },

    async rollback(amount: number): Promise<Account> {
      const p = play.ensure(requireUser().email)
      if (!(amount > 0)) throw new ApiError('nothing_to_rollback', 'Nothing to roll back')
      p.balance += amount
      p.txns = [play.mkTxn('bonus', amount, 'Rollback'), ...p.txns].slice(0, 60)
      play.persist()
      return account()
    },

    async spinWheel(): Promise<WheelResult> {
      const p = play.ensure(requireUser().email)
      if (p.wheelClaimed) throw new ApiError('already_claimed', 'Come back tomorrow for another spin')
      const index = Math.floor(Math.random() * WHEEL.length)
      const prize = WHEEL[index].t
      const euro = prize[0] === '€' ? parseFloat(prize.slice(1)) : 0
      p.wheelClaimed = true; p.bonus += euro
      if (euro) p.txns = [play.mkTxn('bonus', euro, 'Daily wheel'), ...p.txns].slice(0, 60)
      play.persist()
      return { account: account(), index, prize }
    },

    async openChest(): Promise<ChestResult> {
      const p = play.ensure(requireUser().email)
      if (p.chestClaimed) throw new ApiError('already_claimed', 'Come back tomorrow for another chest')
      const prize = CHEST[Math.floor(Math.random() * CHEST.length)]
      p.chestClaimed = true
      if (prize[0] === '€') p.bonus += parseFloat(prize.slice(1))
      play.persist()
      return { account: account(), prize }
    },

    async setLimit(kind: LimitKind, value: number): Promise<LimitResult> {
      const p = play.ensure(requireUser().email)
      if (!(value > 0)) throw new ApiError('bad_amount', 'Enter a valid amount')
      let outcome: 'lowered' | 'scheduled'
      if (value <= p.limits[kind]) { p.limits[kind] = value; delete p.pending[kind]; outcome = 'lowered' }
      else { p.pending[kind] = { value, at: Date.now() + 24 * 3600 * 1000 }; outcome = 'scheduled' }
      play.persist()
      return { account: account(), outcome }
    },

    async cancelPendingLimit(kind: LimitKind): Promise<Account> {
      const p = play.ensure(requireUser().email); delete p.pending[kind]; play.persist(); return account()
    },
    async selfExclude(_period: string): Promise<Account> {
      const p = play.ensure(requireUser().email); p.excluded = true; play.persist(); return account()
    },
    async liftExclusion(): Promise<Account> {
      const p = play.ensure(requireUser().email); p.excluded = false; play.persist(); return account()
    },
    async setRealityChecks(on: boolean): Promise<Account> {
      const p = play.ensure(requireUser().email); p.rc = on; play.persist(); return account()
    },
    async setFavourites(favs: string[]): Promise<Account> {
      const p = play.ensure(requireUser().email); p.favs = favs; play.persist(); return account()
    },
    async setRecent(recent: string[]): Promise<Account> {
      const p = play.ensure(requireUser().email); p.recent = recent; play.persist(); return account()
    },
  }
}
