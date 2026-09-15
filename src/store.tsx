import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Game } from './data'
import { api, ApiError, isLoginChallenge } from './api'
import { affiliateConversion } from './affiliate'
import { track, identify } from './analytics'
import { decideLaunch } from './api/launch'
import type { LaunchMode, LaunchBlock } from './api/launch'
import type { Account, Profile, LimitKind, Session, SessionSummary, TotpStatusResponse, TotpEnrolmentResponse } from './api'
import { loadCcy, saveCcy, loc as locCcy } from './currency'
import type { Ccy } from './currency'
import { loadLang, saveLang, translate } from './i18n'
import type { Lang } from './i18n'

// Re-exported so existing imports (`from '../store'`) keep working.
export type { Txn, Profile, LimitKind, Account } from './api'

export type Page = 'lobby' | 'offers' | 'sports' | 'vip' | 'legal' | 'affiliates' | 'promo'

export type Modal =
  | { type: 'wallet' }
  | { type: 'account' }
  | { type: 'chest' }
  | { type: 'wheel' }
  | { type: 'info'; key: string }
  | { type: 'game'; game: Game }
  | { type: 'blocked'; reason: LaunchBlock; message: string }
  | null

export interface LobbyView { mode: 'all' | 'cat' | 'favs'; cat: string }

// Result helper: every action resolves to a success payload or a user-facing error.
type Ok<T> = { ok: true } & T
type Err = { ok: false; error: string }
export type Res<T = unknown> = Ok<T> | Err
const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

// Auth actions resolve to one of: signed in, a second-factor challenge, or a
// typed error. The UI switches on `code` (never message) to place inline errors
// and to show one generic message on a failed login (no account enumeration).
export type AuthResult =
  | { kind: 'ok' }
  | { kind: 'totp' }
  | { kind: 'error'; code: string; message: string; correlationId?: string; retryAfter?: number; fields?: { path: string; message: string }[] }
const authErr = (e: unknown): AuthResult => (e instanceof ApiError
  ? { kind: 'error', code: e.code, message: e.message, correlationId: e.correlationId, retryAfter: e.retryAfter, fields: e.fields }
  : { kind: 'error', code: 'NETWORK', message: 'Something went wrong. Please try again.' })

type AuthMode = 'join' | 'login' | 'forgot' | 'reset' | null

interface Ctx {
  ready: boolean
  page: Page; setPage: (p: Page) => void
  legalKey: string; openLegal: (key: string) => void
  promoKey: string; openPromo: (key: string) => void
  /** Display currency (fixed-value grid). Defaults from locale; player can override. */
  ccy: Ccy; setCcy: (c: Ccy) => void
  /** Localise a string of {token} money placeholders in the current currency. */
  loc: (s: string) => string
  /** Display language. Defaults from browser locale; player can override. */
  lang: Lang; setLang: (l: Lang) => void
  /** Translate a key (falls back to English, then `fallback`, then the key). */
  t: (key: string, fallback?: string, vars?: Record<string, string>) => string
  lobbyView: LobbyView; setLobbyView: (v: LobbyView) => void
  goLobby: (v?: LobbyView) => void
  user: Account | null
  authModal: AuthMode; setAuthModal: (m: AuthMode) => void
  resetToken: string | null
  modal: Modal; openModal: (m: Modal) => void; closeModal: () => void
  toast: string; showToast: (m: string) => void
  register: (email: string, pass: string, profile: Profile) => Promise<AuthResult>
  login: (email: string, pass: string) => Promise<AuthResult>
  /** Complete a login that returned a TOTP challenge. */
  verifyTotp: (code: string) => Promise<AuthResult>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (newPass: string) => Promise<string | null>
  /** Whether the live backend's security features (sessions, 2FA, verify email) are available. */
  supportsSecurity: boolean
  resendVerification: () => Promise<Res>
  listSessions: () => Promise<SessionSummary[]>
  closeOtherSessions: () => Promise<Res<{ revoked: number }>>
  totpStatus: () => Promise<TotpStatusResponse | null>
  totpEnrol: () => Promise<TotpEnrolmentResponse | null>
  totpActivate: (code: string) => Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }>
  totpDisable: (password: string, code: string) => Promise<Res>
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
  /** Launch a game through the compliance/geo gate (MRB-37): opens it, or shows why it can't. */
  launchGame: (game: Game, mode?: LaunchMode) => void
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
  const [promoKey, setPromoKey] = useState('')
  const [ccy, setCcyState] = useState<Ccy>(() => loadCcy())
  const setCcy = (c: Ccy) => { setCcyState(c); saveCcy(c) }
  const loc = (s: string) => locCcy(s, ccy)
  const [lang, setLangState] = useState<Lang>(() => loadLang())
  const setLang = (l: Lang) => { setLangState(l); saveLang(l) }
  const t = (key: string, fallback?: string, vars?: Record<string, string>) => translate(lang, key, fallback, vars)
  // Reflect the language on <html lang> for a11y / SEO on first paint and changes.
  useEffect(() => { try { document.documentElement.lang = lang } catch { /* ignore */ } }, [lang])
  const [lobbyView, setLobbyView] = useState<LobbyView>({ mode: 'all', cat: '' })
  const goLobby = (v: LobbyView = { mode: 'all', cat: '' }) => { setLobbyView(v); setPage('lobby'); try { window.history.replaceState({}, '', window.location.pathname) } catch { /* ignore */ }; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  // Legal/policy landing pages get their own shareable URL (?legal=<key>).
  const openLegal = (key: string) => { setLegalKey(key); setPage('legal'); try { window.history.pushState({}, '', '?legal=' + key) } catch { /* ignore */ }; window.scrollTo({ top: 0, behavior: 'auto' }) }
  // Each promotion has its own shareable URL (?promo=<key>) — the full T&Cs page.
  const openPromo = (key: string) => { setPromoKey(key); setPage('promo'); try { window.history.pushState({}, '', '?promo=' + key) } catch { /* ignore */ }; window.scrollTo({ top: 0, behavior: 'auto' }) }
  const [authModal, setAuthModal] = useState<AuthMode>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)

  // Restore the session on load (mock: localStorage, http: token + /session).
  useEffect(() => {
    let alive = true
    // A session can die between requests (revoked elsewhere, refresh reuse, a
    // password reset). Clear the UI when the client reports sign-out (brief §5).
    if (api.onSignedOut) api.onSignedOut(() => { if (alive) { setAccount(null); showToast('You have been signed out.') } })
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
      const vt = params.get('verify')
      if (vt) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash)
        if (api.verifyEmail) {
          api.verifyEmail(vt)
            .then(() => api.getSession())
            .then(sess => { if (sess) setAccount(sess.account); showToast('Email verified — thank you!') })
            .catch(() => showToast('That verification link is invalid or has expired.'))
        }
      }
      const lk = params.get('legal')
      if (lk) { setLegalKey(lk); setPage('legal') }
      const pk = params.get('promo')
      if (pk) { setPromoKey(pk); setPage('promo') }
    } catch { /* ignore */ }
  }, [])

  const showToast = (m: string) => {
    setToast(m); window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2400)
  }

  const register = async (email: string, pass: string, profile: Profile): Promise<AuthResult> => {
    try { const s = await api.register({ email, pass, profile }); setAccount(s.account); affiliateConversion('registration'); void identify(); return { kind: 'ok' } }
    catch (e) { return authErr(e) }
  }
  const login = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      const r = await api.login(email, pass)
      if (isLoginChallenge(r)) return { kind: 'totp' }   // second factor needed
      setAccount(r.account); void identify(); return { kind: 'ok' }
    } catch (e) { return authErr(e) }
  }
  const verifyTotp = async (code: string): Promise<AuthResult> => {
    if (!api.verifyTotp) return { kind: 'error', code: 'UNSUPPORTED', message: 'Two-factor sign-in is not available here.' }
    try { const s = await api.verifyTotp(code); setAccount(s.account); void identify(); return { kind: 'ok' } }
    catch (e) { return authErr(e) }
  }
  const logout = async () => { try { await api.logout() } finally { setAccount(null) } }
  const supportsSecurity = !!api.listSessions
  const resendVerification = async (): Promise<Res> => {
    if (!api.resendVerification) return { ok: false, error: 'Not available.' }
    try { await api.resendVerification(); return { ok: true } } catch (e) { return { ok: false, error: errText(e) } }
  }
  const listSessions = async (): Promise<SessionSummary[]> => {
    if (!api.listSessions) return []
    try { return await api.listSessions() } catch { return [] }
  }
  const closeOtherSessions = async (): Promise<Res<{ revoked: number }>> => {
    if (!api.closeOtherSessions) return { ok: false, error: 'Not available.' }
    try { const revoked = await api.closeOtherSessions(); return { ok: true, revoked } } catch (e) { return { ok: false, error: errText(e) } }
  }
  const totpStatus = async (): Promise<TotpStatusResponse | null> => {
    if (!api.totpStatus) return null
    try { return await api.totpStatus() } catch { return null }
  }
  const totpEnrol = async (): Promise<TotpEnrolmentResponse | null> => {
    if (!api.totpEnrol) return null
    try { return await api.totpEnrol() } catch { return null }
  }
  const totpActivate = async (code: string): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }> => {
    if (!api.totpActivate) return { ok: false, error: 'Not available.' }
    try { const recoveryCodes = await api.totpActivate(code); return { ok: true, recoveryCodes } } catch (e) { return { ok: false, error: errText(e) } }
  }
  const totpDisable = async (password: string, code: string): Promise<Res> => {
    if (!api.totpDisable) return { ok: false, error: 'Not available.' }
    try { await api.totpDisable(password, code); return { ok: true } } catch (e) { return { ok: false, error: errText(e) } }
  }
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

  // MRB-37: run the launch gate before opening a game. Always emits
  // game_launch_attempted with the outcome — failed launches are a top signal and
  // the provider never gives them to us. Blocked → show the reason; allowed → open.
  const launchGame = (game: Game, mode: LaunchMode = 'real') => {
    const res = decideLaunch(game, account, mode)
    track('game_launch_attempted', { game: game.name, studio: game.studio, mode, outcome: res.ok ? 'allowed' : res.reason })
    if (!res.ok) {
      if (res.reason === 'AUTH') { setAuthModal('join'); return }
      setModal({ type: 'blocked', reason: res.reason, message: res.message })
      return
    }
    setModal({ type: 'game', game })
    if (account) {
      const recent = [game.name, ...account.recent.filter(n => n !== game.name)].slice(0, 12)
      setAccount({ ...account, recent })
      api.setRecent(recent).then(setAccount).catch(() => { /* keep optimistic */ })
    }
  }

  const openModal = (m: Modal) => { if (m && m.type === 'game') track('game_opened', { game: m.game.name, studio: m.game.studio }); setModal(m) }
  const closeModal = () => setModal(null)

  const value = useMemo<Ctx>(() => ({
    ready, page, setPage, legalKey, openLegal, promoKey, openPromo, ccy, setCcy, loc, lang, setLang, t, lobbyView, setLobbyView, goLobby, user: account, authModal, setAuthModal, resetToken,
    modal, openModal, closeModal, toast, showToast, register, login, verifyTotp, logout, requestPasswordReset, resetPassword,
    supportsSecurity, resendVerification, listSessions, closeOtherSessions, totpStatus, totpEnrol, totpActivate, totpDisable,
    deposit, withdraw, placeBet, rollback, spinWheel, openChest,
    setLimit, cancelPending, selfExclude, liftExclusion, setRealityChecks,
    toggleFav, pushRecent, requireAuth, launchGame,
  }), [ready, page, legalKey, promoKey, ccy, lang, lobbyView, account, authModal, resetToken, modal, toast])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
