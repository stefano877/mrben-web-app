// Local mock adapter — implements MrBenApi against localStorage.
// This is the default when no VITE_API_BASE is set, so the site works with no backend.
// It preserves the exact storage key, shape and migration used by earlier builds.

import type { MrBenApi } from './contract'
import {
  ApiError,
  type Account, type Session, type RegisterInput, type Txn, type TxnKind,
  type LimitKind, type DepositResult, type BetResult, type WheelResult,
  type ChestResult, type LimitResult,
} from './types'
import { WHEEL, CHEST } from '../data'

const KEY = 'mrben.v1'

interface StoredUser extends Account { pass: string }
interface Root { users: Record<string, StoredUser>; session: string | null }

const enc = (s: string) => { try { return btoa(unescape(encodeURIComponent(s))) } catch { return s } }

// Fill in any fields missing from a stored user so accounts saved by older builds still load.
function normalizeUser(email: string, raw: unknown): StoredUser {
  const u = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const lim = (u.limits && typeof u.limits === 'object' ? u.limits : {}) as Record<string, any>
  return {
    email: typeof u.email === 'string' ? u.email : email,
    username: typeof u.username === 'string' ? u.username : (typeof u.email === 'string' ? u.email : email).split('@')[0],
    pass: typeof u.pass === 'string' ? u.pass : '',
    dob: typeof u.dob === 'string' ? u.dob : '',
    phone: typeof u.phone === 'string' ? u.phone : '',
    country: typeof u.country === 'string' ? u.country : '',
    dial: typeof u.dial === 'string' ? u.dial : '',
    marketing: !!u.marketing,
    balance: Number.isFinite(u.balance) ? u.balance : 0,
    bonus: Number.isFinite(u.bonus) ? u.bonus : 0,
    points: Number.isFinite(u.points) ? u.points : 0,
    favs: Array.isArray(u.favs) ? u.favs : [],
    recent: Array.isArray(u.recent) ? u.recent : [],
    txns: Array.isArray(u.txns) ? u.txns : [],
    rc: u.rc === undefined ? true : !!u.rc,
    excluded: !!u.excluded,
    wheelClaimed: !!u.wheelClaimed,
    chestClaimed: !!u.chestClaimed,
    firstDepositDone: !!u.firstDepositDone,
    limits: {
      deposit: Number.isFinite(lim.deposit) ? lim.deposit : 500,
      loss: Number.isFinite(lim.loss) ? lim.loss : 1000,
      session: Number.isFinite(lim.session) ? lim.session : 60,
    },
    pending: (u.pending && typeof u.pending === 'object') ? u.pending : {},
  }
}

function load(): Root {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { users: {}, session: null }
    const r = JSON.parse(raw)
    if (!r || typeof r !== 'object' || typeof r.users !== 'object' || !r.users) return { users: {}, session: null }
    const users: Record<string, StoredUser> = {}
    for (const [email, u] of Object.entries(r.users)) users[email] = normalizeUser(email, u)
    const session = typeof r.session === 'string' && users[r.session] ? r.session : null
    return { users, session }
  } catch {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    return { users: {}, session: null }
  }
}

// Strip the password before handing an account to the UI.
function toAccount(u: StoredUser): Account {
  const { pass: _pass, ...account } = u
  return account
}

export function createMockApi(): MrBenApi {
  const root: Root = load()
  let txnSeq = Math.max(0, ...Object.values(root.users).flatMap(u => u.txns.map(t => t.id))) + 1

  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(root)) } catch { /* ignore */ } }
  const mkTxn = (kind: TxnKind, amount: number, label: string): Txn => ({ id: txnSeq++, kind, amount, label, at: Date.now() })
  const token = (email: string) => `mock.${enc(email)}`
  // In-memory reset tokens for the offline demo (no email transport exists).
  const resets: Record<string, string> = {}

  // Apply any scheduled RG increase whose effective time has passed.
  const applyDue = (u: StoredUser) => {
    const kinds: LimitKind[] = ['deposit', 'loss', 'session']
    let changed = false
    for (const k of kinds) {
      const p = u.pending[k]
      if (p && p.at <= Date.now()) { u.limits[k] = p.value; delete u.pending[k]; changed = true }
    }
    return changed
  }

  const current = (): StoredUser => {
    const u = root.session ? root.users[root.session] : null
    if (!u) throw new ApiError('unauthenticated', 'Please log in to continue')
    return u
  }

  const settle = <T>(u: StoredUser, extra: Omit<T, 'account'>): T => {
    persist()
    return { account: toAccount(u), ...extra } as T
  }

  return {
    async getSession(): Promise<Session | null> {
      const u = root.session ? root.users[root.session] : null
      if (!u) return null
      if (applyDue(u)) persist()
      return { token: token(u.email), account: toAccount(u) }
    },

    async register(input: RegisterInput): Promise<Session> {
      const email = input.email.trim().toLowerCase()
      const { pass, profile } = input
      if (!email || !/.+@.+\..+/.test(email)) throw new ApiError('bad_email', 'Enter a valid email')
      if (pass.length < 4) throw new ApiError('bad_password', 'Password must be at least 4 characters')
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(profile.username)) throw new ApiError('bad_username', 'Username: 3 to 16 letters, numbers or underscores')
      if (Object.values(root.users).some(u => u.username.toLowerCase() === profile.username.toLowerCase()))
        throw new ApiError('username_taken', 'That username is already taken')
      if (!profile.dob) throw new ApiError('bad_dob', 'Enter your date of birth')
      const d = new Date(profile.dob), now = new Date()
      let age = now.getFullYear() - d.getFullYear()
      const m = now.getMonth() - d.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
      if (isNaN(age)) throw new ApiError('bad_dob', 'Enter a valid date of birth')
      if (age < 18) throw new ApiError('underage', 'You must be 18 or older to register')
      if (!profile.country) throw new ApiError('no_country', 'Please pick your country')
      if (profile.phone.replace(/\D/g, '').length < 6) throw new ApiError('bad_phone', 'Enter a valid phone number')
      if (root.users[email]) throw new ApiError('email_taken', 'An account with that email already exists')

      const u: StoredUser = {
        email, username: profile.username, pass: enc(pass), dob: profile.dob,
        phone: profile.phone, country: profile.country, dial: profile.dial, marketing: profile.marketing,
        balance: 0, bonus: 0, points: 0, favs: [], recent: [], txns: [],
        rc: true, excluded: false, wheelClaimed: false, chestClaimed: false, firstDepositDone: false,
        limits: { deposit: 500, loss: 1000, session: 60 }, pending: {},
      }
      root.users[email] = u
      root.session = email
      persist()
      return { token: token(email), account: toAccount(u) }
    },

    async login(email: string, pass: string): Promise<Session> {
      email = email.trim().toLowerCase()
      const u = root.users[email]
      if (!u) throw new ApiError('no_account', 'No account with that email')
      if (u.pass !== enc(pass)) throw new ApiError('wrong_password', 'Wrong password')
      root.session = email
      applyDue(u)
      persist()
      return { token: token(email), account: toAccount(u) }
    },

    async logout(): Promise<void> {
      root.session = null
      persist()
    },

    async requestPasswordReset(email: string): Promise<void> {
      // No email transport offline. If the account exists, mint a demo token and
      // log the link to the console so the flow can be walked through. Resolve
      // the same way regardless, so existence is never revealed to the caller.
      email = email.trim().toLowerCase()
      if (root.users[email]) {
        const t = 'demo-' + enc(email + ':' + Date.now()).slice(0, 20)
        resets[t] = email
        try { console.info('[mock] password reset link:', location.origin + '/?reset=' + t) } catch { /* ignore */ }
      }
    },

    async resetPassword(token: string, newPass: string): Promise<void> {
      if (newPass.length < 12) throw new ApiError('weak_password', 'Password must be at least 12 characters')
      const email = resets[token]
      if (!email || !root.users[email]) throw new ApiError('invalid_reset', 'This link is invalid or has expired')
      root.users[email].pass = enc(newPass)
      delete resets[token]
      root.session = null // a reset invalidates existing sessions
      persist()
    },

    async deposit(amount: number, method: string): Promise<DepositResult> {
      const u = current()
      if (!(amount > 0)) throw new ApiError('bad_amount', 'Enter an amount')
      let bonusAdded = 0
      if (!u.firstDepositDone) { bonusAdded = Math.min(200, amount); u.bonus += bonusAdded; u.firstDepositDone = true }
      u.balance += amount
      u.txns = [
        mkTxn('deposit', amount, `Deposit (${method})`),
        ...(bonusAdded ? [mkTxn('bonus', bonusAdded, 'Welcome bonus 100%')] : []),
        ...u.txns,
      ].slice(0, 60)
      return settle<DepositResult>(u, { bonusAdded })
    },

    async withdraw(amount: number, method: string): Promise<Account> {
      const u = current()
      if (!(amount > 0)) throw new ApiError('bad_amount', 'Enter an amount')
      if (amount > u.balance) throw new ApiError('insufficient', 'Amount exceeds balance')
      u.balance -= amount
      u.txns = [mkTxn('withdraw', amount, `Withdrawal (${method})`), ...u.txns].slice(0, 60)
      persist()
      return toAccount(u)
    },

    async placeBet(_gameId: string, gameName: string, bet: number): Promise<BetResult> {
      const u = current()
      if (u.excluded) throw new ApiError('excluded', 'Self-excluded. Play is blocked.')
      if (u.balance < bet) throw new ApiError('insufficient', 'Insufficient funds. Top up your wallet.')
      const win = Math.random() < 0.42 ? +(bet * (Math.random() * 4 + 1.5)).toFixed(2) : 0
      u.balance = u.balance - bet + win
      u.points += Math.round(bet)
      u.txns = [
        mkTxn('bet', bet, `Bet · ${gameName}`),
        ...(win > 0 ? [mkTxn('win', win, `Win · ${gameName}`)] : []),
        ...u.txns,
      ].slice(0, 60)
      return settle<BetResult>(u, { win })
    },

    async rollback(amount: number): Promise<Account> {
      const u = current()
      if (!(amount > 0)) throw new ApiError('nothing_to_rollback', 'Nothing to roll back')
      u.balance += amount
      u.txns = [mkTxn('bonus', amount, 'Rollback'), ...u.txns].slice(0, 60)
      persist()
      return toAccount(u)
    },

    async spinWheel(): Promise<WheelResult> {
      const u = current()
      if (u.wheelClaimed) throw new ApiError('already_claimed', 'Come back tomorrow for another spin')
      const index = Math.floor(Math.random() * WHEEL.length)
      const prize = WHEEL[index].t
      const euro = prize[0] === '€' ? parseFloat(prize.slice(1)) : 0
      u.wheelClaimed = true
      u.bonus += euro
      if (euro) u.txns = [mkTxn('bonus', euro, 'Daily wheel'), ...u.txns].slice(0, 60)
      return settle<WheelResult>(u, { index, prize })
    },

    async openChest(): Promise<ChestResult> {
      const u = current()
      if (u.chestClaimed) throw new ApiError('already_claimed', 'Come back tomorrow for another chest')
      const prize = CHEST[Math.floor(Math.random() * CHEST.length)]
      u.chestClaimed = true
      if (prize[0] === '€') u.bonus += parseFloat(prize.slice(1))
      return settle<ChestResult>(u, { prize })
    },

    async setLimit(kind: LimitKind, value: number): Promise<LimitResult> {
      const u = current()
      if (!(value > 0)) throw new ApiError('bad_amount', 'Enter a valid amount')
      let outcome: 'lowered' | 'scheduled'
      if (value <= u.limits[kind]) {
        u.limits[kind] = value
        delete u.pending[kind]
        outcome = 'lowered'
      } else {
        u.pending[kind] = { value, at: Date.now() + 24 * 3600 * 1000 }
        outcome = 'scheduled'
      }
      return settle<LimitResult>(u, { outcome })
    },

    async cancelPendingLimit(kind: LimitKind): Promise<Account> {
      const u = current()
      delete u.pending[kind]
      persist()
      return toAccount(u)
    },

    async selfExclude(_period: string): Promise<Account> {
      const u = current()
      u.excluded = true
      persist()
      return toAccount(u)
    },

    async liftExclusion(): Promise<Account> {
      const u = current()
      u.excluded = false
      persist()
      return toAccount(u)
    },

    async setRealityChecks(on: boolean): Promise<Account> {
      const u = current()
      u.rc = on
      persist()
      return toAccount(u)
    },

    async setFavourites(favs: string[]): Promise<Account> {
      const u = current()
      u.favs = favs
      persist()
      return toAccount(u)
    },

    async setRecent(recent: string[]): Promise<Account> {
      const u = current()
      u.recent = recent
      persist()
      return toAccount(u)
    },
  }
}
