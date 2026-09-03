import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Game } from './data'
import { api, ApiError } from './api'
import { affiliateConversion } from './affiliate'
import { track, identify } from './analytics'
import type { Account, Profile, LimitKind } from './api'

// Re-exported so existing imports (`from '../store'`) keep working.
export type { Txn, Profile, LimitKind, Account } from './api'

export type Page = 'lobby' | 'offers' | 'sports' | 'vip' | 'legal' | 'affiliates'

export type Modal =
  | { type: 'wallet' }
  | { type: 'account' }
  | { type: 'chest' }
  | { type: 'wheel' }
  | { type: 'info'; key: string }
  | { type: 'game'; game: Game }
  | null

export interface LobbyView { mode: 'all' | 'cat' | 'favs'; cat: string }

// Result helper: every action resolves to a success payload or a user-facing error.
type Ok<T> = { ok: true } & T
type Err = { ok: false; error: string }
export type Res<T = unknown> = Ok<T> | Err
const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

type AuthMode = 'join' | 'login' | 'forgot' | 'reset' | null

interface Ctx {
  ready: boolean
  page: Page; setPage: (p: Page) => void
  legalKey: string; openLegal: (key: string) => void
  lobbyView: LobbyView; setLobbyView: (v: LobbyView) => void
  goLobby: (v?: LobbyView) => void
  user: Account | null
  authModal: AuthMode; setAuthModal: (m: AuthMode) => void
  resetToken: string | null
  modal: Modal; openModal: (m: Modal) => void; closeModal: () => void
  toast: string; showToast: (m: string) => void
  register: (email: string, pass: string, profile: Profile) => Promise<string | null>
  login: (email: string, pass: string) => Promise<string | null>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (newPass: string) => Promise<string | null>
  deposit: (amount: number, method: string) => Promise<Res<{ bonusAdded: number; firstBefore: boolean }>>
  withdraw: (amount: number, method: string) => Promise<Res>
  placeBet: (game: Game, bet: number) => Promise<Res<{ win: number }>>
  rollback: (amount: number) => Promise<Res>
  spinWheel: () => Promise<Res<{ index: number; prize: string }>>
  openChest: () => Promise<Res<{ prize: string }>>
  setLimit: (kind: LimitKind, value: number) => Promise<Res<{ outcome: 'lowered' | 'scheduled' }>>
  cancelPending: (kind: LimitKind) => Promise<Res>
  selfExclude: (period: string) => Promise<Res>
  liftExclusion: () => Promise<Res>
  setRealityChecks: (on: boolean) => Promise<Res>
  toggleFav: (name: string) => void
  pushRecent: (name: string) => void
  requireAuth: () => boolean
}

const AppCtx = createContext<Ctx | null>(null)
export const useApp = () => {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside provider')
  return c
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState<Page>('lobby')
  const [legalKey, setLegalKey] = useState('')
  const [lobbyView, setLobbyView] = useState<LobbyView>({ mode: 'all', cat: '' })
  const goLobby = (v: LobbyView = { mode: 'all', cat: '' }) => { setLobbyView(v); setPage('lobby'); try { window.history.replaceState({}, '', window.location.pathname) } catch { /* ignore */ }; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  // Legal/policy landing pages get their own shareable URL (?legal=<key>).
  const openLegal = (key: string) => { setLegalKey(key); setPage('legal'); try { window.history.pushState({}, '', '?legal=' + key) } catch { /* ignore */ }; window.scrollTo({ top: 0, behavior: 'auto' }) }
  const [authModal, setAuthModal] = useState<AuthMode>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)

  // Restore the session on load (mock: localStorage, http: token + /session).
  useEffect(() => {
    let alive = true
    api.getSession()
      .then(s => { if (alive) setAccount(s?.account ?? null) })
      .catch(() => { /* start logged out */ })
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // A reset link (?reset=<token>) opens the reset form. Strip the token from the
  // URL immediately so it never lingers in browser history, referrer headers or
  // analytics. The token is only ever held in memory and sent to the backend.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('reset')
      if (t) {
        setResetToken(t)
        setAuthModal('reset')
        window.history.replaceState({}, '', window.location.pathname + window.location.hash)
      }
      const lk = params.get('legal')
      if (lk) { setLegalKey(lk); setPage('legal') }
    } catch { /* ignore */ }
  }, [])

  const showToast = (m: string) => {
    setToast(m); window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2400)
  }

  const register = async (email: string, pass: string, profile: Profile): Promise<string | null> => {
    try { const s = await api.register({ email, pass, profile }); setAccount(s.account); affiliateConversion('registration'); void identify(); return null }
    catch (e) { return errText(e) }
  }
  const login = async (email: string, pass: string): Promise<string | null> => {
    try { const s = await api.login(email, pass); setAccount(s.account); void identify(); return null }
    catch (e) { return errText(e) }
  }
  const logout = async () => { try { await api.logout() } finally { setAccount(null) } }
  // Always resolves the same way. The UI shows a generic confirmation so nobody
  // can learn from this whether an email is registered (no account enumeration).
  const requestPasswordReset = async (email: string): Promise<void> => {
    try { await api.requestPasswordReset(email) } catch { /* ignore */ }
  }
  // Generic failure message regardless of the server's reason, so an invalid vs
  // expired vs unknown token is indistinguishable.
  const resetPassword = async (newPass: string): Promise<string | null> => {
    if (!resetToken) return 'This link is invalid or has expired. Request a new one.'
    try { await api.resetPassword(resetToken, newPass); setResetToken(null); return null }
    catch { return 'This link is invalid or has expired. Request a new one.' }
  }

  const deposit = async (amount: number, method: string): Promise<Res<{ bonusAdded: number; firstBefore: boolean }>> => {
    const firstBefore = !!account?.firstDepositDone
    try { const r = await api.deposit(amount, method); setAccount(r.account); affiliateConversion(firstBefore ? 'deposit' : 'ftd', { amount, method }); return { ok: true, bonusAdded: r.bonusAdded, firstBefore } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const withdraw = async (amount: number, method: string): Promise<Res> => {
    try { const a = await api.withdraw(amount, method); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const placeBet = async (game: Game, bet: number): Promise<Res<{ win: number }>> => {
    try { const r = await api.placeBet(game.name, game.name, bet); setAccount(r.account); return { ok: true, win: r.win } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const rollback = async (amount: number): Promise<Res> => {
    try { const a = await api.rollback(amount); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const spinWheel = async (): Promise<Res<{ index: number; prize: string }>> => {
    try { const r = await api.spinWheel(); setAccount(r.account); return { ok: true, index: r.index, prize: r.prize } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const openChest = async (): Promise<Res<{ prize: string }>> => {
    try { const r = await api.openChest(); setAccount(r.account); return { ok: true, prize: r.prize } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const setLimit = async (kind: LimitKind, value: number): Promise<Res<{ outcome: 'lowered' | 'scheduled' }>> => {
    try { const r = await api.setLimit(kind, value); setAccount(r.account); return { ok: true, outcome: r.outcome } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const cancelPending = async (kind: LimitKind): Promise<Res> => {
    try { const a = await api.cancelPendingLimit(kind); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const selfExclude = async (period: string): Promise<Res> => {
    try { const a = await api.selfExclude(period); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const liftExclusion = async (): Promise<Res> => {
    try { const a = await api.liftExclusion(); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }
  const setRealityChecks = async (on: boolean): Promise<Res> => {
    try { const a = await api.setRealityChecks(on); setAccount(a); return { ok: true } }
    catch (e) { return { ok: false, error: errText(e) } }
  }

  // Personalization — optimistic locally, synced through the seam.
  const toggleFav = (name: string) => {
    if (!account) { setAuthModal('join'); return }
    const favs = account.favs.includes(name) ? account.favs.filter(n => n !== name) : [...account.favs, name]
    setAccount({ ...account, favs })
    api.setFavourites(favs).then(setAccount).catch(() => { /* keep optimistic */ })
  }
  const pushRecent = (name: string) => {
    if (!account) return
    const recent = [name, ...account.recent.filter(n => n !== name)].slice(0, 12)
    setAccount({ ...account, recent })
    api.setRecent(recent).then(setAccount).catch(() => { /* keep optimistic */ })
  }
  const requireAuth = () => { if (!account) { setAuthModal('join'); return false } return true }

  const openModal = (m: Modal) => { if (m && m.type === 'game') track('game_opened', { game: m.game.name, studio: m.game.studio }); setModal(m) }
  const closeModal = () => setModal(null)

  const value = useMemo<Ctx>(() => ({
    ready, page, setPage, legalKey, openLegal, lobbyView, setLobbyView, goLobby, user: account, authModal, setAuthModal, resetToken,
    modal, openModal, closeModal, toast, showToast, register, login, logout, requestPasswordReset, resetPassword,
    deposit, withdraw, placeBet, rollback, spinWheel, openChest,
    setLimit, cancelPending, selfExclude, liftExclusion, setRealityChecks,
    toggleFav, pushRecent, requireAuth,
  }), [ready, page, legalKey, lobbyView, account, authModal, resetToken, modal, toast])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
