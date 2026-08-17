// HTTP adapter — implements MrBenApi against Willmer's backend.
// Activated automatically when VITE_API_BASE is set (see api/index.ts).
// The backend just needs to serve the endpoints listed in api/contract.ts and
// return the shapes in api/types.ts. See api/README.md for the full contract.

import type { MrBenApi } from './contract'
import {
  ApiError,
  type Account, type Session, type RegisterInput, type DepositResult,
  type BetResult, type WheelResult, type ChestResult, type LimitResult, type LimitKind,
} from './types'

const TOKEN_KEY = 'mrben.token'

const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const setToken = (t: string | null) => {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

// A fresh idempotency key per mutating request so retries never double-charge a wallet.
const idem = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function createHttpApi(baseUrl: string): MrBenApi {
  const base = baseUrl.replace(/\/$/, '')

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (method !== 'GET') headers['Idempotency-Key'] = idem()

    let res: Response
    try {
      res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError('network', 'Cannot reach the server. Check your connection and try again.')
    }

    if (res.status === 204) return undefined as T
    let data: any = null
    try { data = await res.json() } catch { /* may be empty */ }

    if (!res.ok) {
      const code = data?.code ?? `http_${res.status}`
      const message = data?.message ?? 'Something went wrong. Please try again.'
      if (res.status === 401) setToken(null)
      throw new ApiError(code, message)
    }
    return data as T
  }

  // Auth responses carry the token; stash it for subsequent requests.
  const auth = async (path: string, body: unknown): Promise<Session> => {
    const s = await call<Session>('POST', path, body)
    setToken(s.token)
    return s
  }

  return {
    async getSession() {
      if (!getToken()) return null
      try { return await call<Session>('GET', '/session') }
      catch (e) { if (e instanceof ApiError && e.code === 'http_401') { setToken(null); return null } throw e }
    },
    register: (input: RegisterInput) => auth('/auth/register', input),
    login: (email: string, pass: string) => auth('/auth/login', { email, pass }),
    async logout() { try { await call<void>('POST', '/auth/logout') } finally { setToken(null) } },

    deposit: (amount: number, method: string) => call<DepositResult>('POST', '/wallet/deposit', { amount, method }),
    withdraw: (amount: number, method: string) => call<Account>('POST', '/wallet/withdraw', { amount, method }),

    placeBet: (gameId: string, gameName: string, bet: number) =>
      call<BetResult>('POST', '/game/bet', { gameId, gameName, bet }),
    rollback: (amount: number) => call<Account>('POST', '/game/rollback', { amount }),

    spinWheel: () => call<WheelResult>('POST', '/bonus/wheel'),
    openChest: () => call<ChestResult>('POST', '/bonus/chest'),

    setLimit: (kind: LimitKind, value: number) => call<LimitResult>('PUT', `/rg/limits/${kind}`, { value }),
    cancelPendingLimit: (kind: LimitKind) => call<Account>('DELETE', `/rg/limits/${kind}/pending`),
    selfExclude: (period: string) => call<Account>('POST', '/rg/self-exclude', { period }),
    liftExclusion: () => call<Account>('POST', '/rg/self-exclude/lift'),
    setRealityChecks: (on: boolean) => call<Account>('PUT', '/rg/reality-checks', { on }),

    setFavourites: (favs: string[]) => call<Account>('PUT', '/me/favourites', { favs }),
    setRecent: (recent: string[]) => call<Account>('PUT', '/me/recent', { recent }),
  }
}
