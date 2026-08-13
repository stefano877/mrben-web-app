import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Game } from './data'

export type Page = 'lobby' | 'offers' | 'sports' | 'vip'
export interface Txn { id: number; kind: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus'; amount: number; label: string; at: number }
export interface Profile { username: string; dob: string; phone: string; country: string; dial: string; marketing: boolean }
export interface User {
  email: string
  username: string
  pass: string
  dob: string
  phone: string
  country: string
  dial: string
  marketing: boolean
  balance: number
  bonus: number
  points: number
  favs: string[]
  recent: string[]
  txns: Txn[]
  rc: boolean
  excluded: boolean
  wheelClaimed: boolean
  chestClaimed: boolean
  firstDepositDone: boolean
  limits: { deposit: number; loss: number; session: number }
  pending: { deposit?: { value: number; at: number }; loss?: { value: number; at: number }; session?: { value: number; at: number } }
}
export type LimitKind = 'deposit' | 'loss' | 'session'
interface Root { users: Record<string, User>; session: string | null }

export type Modal =
  | { type: 'wallet' }
  | { type: 'account' }
  | { type: 'chest' }
  | { type: 'wheel' }
  | { type: 'game'; game: Game }
  | null

const KEY = 'mrben.v1'
function load(): Root {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const r = JSON.parse(raw); if (r && r.users) return r }
  } catch { /* ignore */ }
  return { users: {}, session: null }
}
const enc = (s: string) => { try { return btoa(unescape(encodeURIComponent(s))) } catch { return s } }

function newUser(email: string, pass: string, profile?: Profile): User {
  return {
    email, username: profile?.username ?? email.split('@')[0], pass: enc(pass), dob: profile?.dob ?? '',
    phone: profile?.phone ?? '', country: profile?.country ?? '', dial: profile?.dial ?? '', marketing: profile?.marketing ?? false,
    balance: 0, bonus: 0, points: 0,
    favs: [], recent: [], txns: [],
    rc: true, excluded: false, wheelClaimed: false, chestClaimed: false, firstDepositDone: false,
    limits: { deposit: 500, loss: 1000, session: 60 }, pending: {},
  }
}

export interface LobbyView { mode: 'all' | 'cat' | 'favs'; cat: string }
interface Ctx {
  page: Page; setPage: (p: Page) => void
  lobbyView: LobbyView; setLobbyView: (v: LobbyView) => void
  goLobby: (v?: LobbyView) => void
  user: User | null
  authModal: 'join' | 'login' | null; setAuthModal: (m: 'join' | 'login' | null) => void
  modal: Modal; openModal: (m: Modal) => void; closeModal: () => void
  toast: string; showToast: (m: string) => void
  register: (email: string, pass: string, profile?: Profile) => string | null
  login: (email: string, pass: string) => string | null
  logout: () => void
  update: (patch: Partial<User>) => void
  mutate: (fn: (u: User) => Partial<User>) => void
  setLimit: (kind: LimitKind, value: number) => 'lowered' | 'scheduled'
  cancelPending: (kind: LimitKind) => void
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
  const [root, setRoot] = useState<Root>(() => load())
  const [page, setPage] = useState<Page>('lobby')
  const [lobbyView, setLobbyView] = useState<LobbyView>({ mode: 'all', cat: '' })
  const goLobby = (v: LobbyView = { mode: 'all', cat: '' }) => { setLobbyView(v); setPage('lobby'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const [authModal, setAuthModal] = useState<'join' | 'login' | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(root)) } catch { /* ignore */ } }, [root])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const user = root.session ? root.users[root.session] ?? null : null

  const showToast = (m: string) => {
    setToast(m); window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2400)
  }

  const register = (email: string, pass: string, profile?: Profile): string | null => {
    email = email.trim().toLowerCase()
    if (!email || !/.+@.+\..+/.test(email)) return 'Enter a valid email'
    if (pass.length < 4) return 'Password must be at least 4 characters'
    if (profile) {
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(profile.username)) return 'Username: 3 to 16 letters, numbers or underscores'
      const taken = Object.values(root.users).some(u => u.username.toLowerCase() === profile.username.toLowerCase())
      if (taken) return 'That username is already taken'
      if (!profile.dob) return 'Enter your date of birth'
      const d = new Date(profile.dob), now = new Date()
      let age = now.getFullYear() - d.getFullYear()
      const m = now.getMonth() - d.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
      if (isNaN(age)) return 'Enter a valid date of birth'
      if (age < 18) return 'You must be 18 or older to register'
      if (!profile.country) return 'Please pick your country'
      if (profile.phone.replace(/\D/g, '').length < 6) return 'Enter a valid phone number'
    }
    if (root.users[email]) return 'An account with that email already exists'
    const u = newUser(email, pass, profile)
    setRoot(r => ({ users: { ...r.users, [email]: u }, session: email }))
    return null
  }
  const login = (email: string, pass: string): string | null => {
    email = email.trim().toLowerCase()
    const u = root.users[email]
    if (!u) return 'No account with that email'
    if (u.pass !== enc(pass)) return 'Wrong password'
    setRoot(r => ({ ...r, session: email }))
    return null
  }
  const logout = () => setRoot(r => ({ ...r, session: null }))

  const update = (patch: Partial<User>) => {
    setRoot(r => {
      if (!r.session) return r
      const cur = r.users[r.session]; if (!cur) return r
      return { ...r, users: { ...r.users, [r.session]: { ...cur, ...patch } } }
    })
  }
  const mutate = (fn: (u: User) => Partial<User>) => {
    setRoot(r => {
      if (!r.session) return r
      const cur = r.users[r.session]; if (!cur) return r
      return { ...r, users: { ...r.users, [r.session]: { ...cur, ...fn(cur) } } }
    })
  }
  // RG limits: a decrease takes effect immediately; an increase is delayed 24h and shown as pending (cancellable).
  const setLimit = (kind: LimitKind, value: number): 'lowered' | 'scheduled' => {
    let outcome: 'lowered' | 'scheduled' = 'lowered'
    mutate(u => {
      if (value <= u.limits[kind]) {
        const pending = { ...u.pending }; delete pending[kind]
        outcome = 'lowered'
        return { limits: { ...u.limits, [kind]: value }, pending }
      }
      outcome = 'scheduled'
      return { pending: { ...u.pending, [kind]: { value, at: Date.now() + 24 * 3600 * 1000 } } }
    })
    return outcome
  }
  const cancelPending = (kind: LimitKind) => mutate(u => { const pending = { ...u.pending }; delete pending[kind]; return { pending } })

  // Apply any scheduled increase whose effective time has passed.
  useEffect(() => {
    if (!user) return
    const kinds: LimitKind[] = ['deposit', 'loss', 'session']
    const due = kinds.filter(k => { const p = user.pending[k]; return p && p.at <= Date.now() })
    if (due.length) mutate(u => {
      const limits = { ...u.limits }; const pending = { ...u.pending }
      due.forEach(k => { const p = pending[k]; if (p) { limits[k] = p.value; delete pending[k] } })
      return { limits, pending }
    })
  }, [user])

  const toggleFav = (name: string) => {
    if (!user) { setAuthModal('join'); return }
    const has = user.favs.includes(name)
    update({ favs: has ? user.favs.filter(n => n !== name) : [...user.favs, name] })
  }
  const pushRecent = (name: string) => {
    if (!user) return
    update({ recent: [name, ...user.recent.filter(n => n !== name)].slice(0, 12) })
  }
  const requireAuth = () => { if (!user) { setAuthModal('join'); return false } return true }

  const openModal = (m: Modal) => setModal(m)
  const closeModal = () => setModal(null)

  const value = useMemo<Ctx>(() => ({
    page, setPage, lobbyView, setLobbyView, goLobby, user, authModal, setAuthModal, modal, openModal, closeModal,
    toast, showToast, register, login, logout, update, mutate, setLimit, cancelPending, toggleFav, pushRecent, requireAuth,
  }), [page, lobbyView, root, authModal, modal, toast])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
