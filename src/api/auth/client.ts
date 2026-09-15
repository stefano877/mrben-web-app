// Auth client for the backend (mrben-backend), built to the integration brief
// (docs/frontend-auth-integration.md) and the 2FA doc. The access token lives
// ONLY in this closure's memory — never in localStorage. The refresh token is an
// httpOnly cookie the browser manages, so every call sends credentials:'include'
// and refresh needs no body.
//
// Key rules honoured here:
//  - single in-flight refresh (concurrent 401s must not replay a consumed token)
//  - retry a 401'd request once after a successful refresh, then give up
//  - refresh once on boot to restore a session from the cookie
//  - login may return a TOTP challenge instead of a session (branch, never assume)
//  - throw AuthError carrying the server's `code` (never switch on messages) and,
//    on 429, the Retry-After header

import type {
  AuthenticatedUser, AuthSessionResponse, RegisterRequest, SessionSummary, FieldError,
  LoginOutcome, TotpChallengeResponse, TotpStatusResponse, TotpEnrolmentResponse, RecoveryCodesResponse,
} from './types'

export class AuthError extends Error {
  code: string
  status: number
  correlationId?: string
  fields?: FieldError[]
  /** Seconds to wait, parsed from the Retry-After header on a 429. */
  retryAfter?: number
  constructor(code: string, message: string, opts: { status?: number; correlationId?: string; fields?: FieldError[]; retryAfter?: number } = {}) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.status = opts.status ?? 0
    this.correlationId = opts.correlationId
    this.fields = opts.fields
    this.retryAfter = opts.retryAfter
  }
}

const cid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export interface AuthClient {
  register(input: RegisterRequest): Promise<AuthenticatedUser>
  /** Returns a signed-in user OR a TOTP challenge — discriminate on the result. */
  login(email: string, password: string): Promise<LoginOutcome>
  /** Complete a login that returned a challenge. Uses the challenge cookie, no bearer. */
  verifyTotp(code: string): Promise<AuthenticatedUser>
  logout(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  verifyEmail(token: string): Promise<void>
  resendVerification(): Promise<void>
  me(): Promise<AuthenticatedUser>
  bootstrap(): Promise<AuthenticatedUser | null>
  listSessions(): Promise<SessionSummary[]>
  closeOtherSessions(): Promise<number>
  totpStatus(): Promise<TotpStatusResponse>
  totpEnrol(): Promise<TotpEnrolmentResponse>
  totpActivate(code: string): Promise<string[]>
  totpDisable(password: string, code: string): Promise<void>
  getAccessToken(): string | null
  onSignedOut(cb: () => void): void
}

export function createAuthClient(apiBase: string): AuthClient {
  const base = apiBase.replace(/\/$/, '')
  const auth = (p: string) => `${base}/v1/auth${p}`

  let accessToken: string | null = null            // memory only
  let currentUser: AuthenticatedUser | null = null
  let inFlightRefresh: Promise<string> | null = null
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  const signedOutCbs: Array<() => void> = []

  const clearTimer = () => { if (refreshTimer !== undefined) { clearTimeout(refreshTimer); refreshTimer = undefined } }

  const signOut = () => {
    accessToken = null
    currentUser = null
    clearTimer()
    for (const cb of signedOutCbs) { try { cb() } catch { /* ignore */ } }
  }

  const applySession = (s: AuthSessionResponse) => {
    accessToken = s.accessToken
    currentUser = s.user
    clearTimer()
    const ms = Math.max(5, Math.floor(s.expiresIn * 0.8)) * 1000
    refreshTimer = setTimeout(() => { void refresh().catch(() => signOut()) }, ms)
    return s.user
  }

  async function toError(res: Response): Promise<AuthError> {
    let body: any = null
    try { body = await res.json() } catch { /* empty */ }
    const e = body?.error ?? {}
    const ra = res.headers.get('retry-after')
    return new AuthError(e.code ?? `HTTP_${res.status}`, e.message ?? 'Request failed', {
      status: res.status, correlationId: e.correlationId, fields: e.fields,
      retryAfter: ra ? Number(ra) || undefined : undefined,
    })
  }

  async function rawFetch(method: string, url: string, opts: { body?: unknown; bearer?: boolean } = {}): Promise<Response> {
    const headers: Record<string, string> = { 'x-correlation-id': cid() }
    if (opts.body !== undefined) headers['content-type'] = 'application/json'
    if (opts.bearer && accessToken) headers['authorization'] = `Bearer ${accessToken}`
    return fetch(url, {
      method,
      credentials: 'include',                       // carries the refresh / challenge cookie on /v1/auth
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  }

  function refresh(): Promise<string> {
    // Every concurrent caller awaits the same request; the token is single-use,
    // so firing two refreshes would replay a consumed token and nuke the session.
    inFlightRefresh ??= (async () => {
      const res = await rawFetch('POST', auth('/refresh'))
      if (!res.ok) { accessToken = null; throw await toError(res) }
      applySession(await res.json() as AuthSessionResponse)
      return accessToken as string
    })().finally(() => { inFlightRefresh = null })
    return inFlightRefresh
  }

  async function parsePublic(res: Response): Promise<AuthSessionResponse> {
    if (!res.ok) throw await toError(res)
    return res.json() as Promise<AuthSessionResponse>
  }

  // Authenticated request with lazy token restore + one refresh-and-retry on 401.
  async function callAuthed<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (accessToken === null) {
      try { await refresh() } catch (e) { signOut(); throw e }
    }
    let res = await rawFetch(method, auth(path), { body, bearer: true })
    if (res.status === 401) {
      try { await refresh() } catch (e) { signOut(); throw e }
      res = await rawFetch(method, auth(path), { body, bearer: true })
      if (res.status === 401) { const err = await toError(res); signOut(); throw err }
    }
    if (!res.ok) throw await toError(res)
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  return {
    async register(input: RegisterRequest) {
      const res = await rawFetch('POST', auth('/register'), { body: input })
      return applySession(await parsePublic(res))
    },
    async login(email: string, password: string): Promise<LoginOutcome> {
      const res = await rawFetch('POST', auth('/login'), { body: { email, password } })
      if (!res.ok) throw await toError(res)
      const body = await res.json() as AuthSessionResponse | TotpChallengeResponse
      // A challenge carries `status`; a session does not (2FA doc §1).
      if (body && typeof body === 'object' && 'status' in body) {
        return { challenge: body as TotpChallengeResponse }
      }
      return { user: applySession(body as AuthSessionResponse) }
    },
    async verifyTotp(code: string) {
      // The half-authenticated challenge rides in the httpOnly cookie; send only the code.
      const res = await rawFetch('POST', auth('/totp/verify'), { body: { code } })
      return applySession(await parsePublic(res))
    },
    async logout() {
      try { await callAuthed<{ success: true }>('POST', '/logout') } finally { signOut() }
    },
    async requestPasswordReset(email: string) {
      // Public endpoint. Fire and forget: swallow errors so the caller can never
      // infer whether the address is registered (no account enumeration).
      try { await rawFetch('POST', auth('/forgot-password'), { body: { email } }) } catch { /* intentionally ignored */ }
    },
    async resetPassword(token: string, password: string) {
      const res = await rawFetch('POST', auth('/reset-password'), { body: { token, password } })
      if (!res.ok) throw await toError(res)
    },
    async verifyEmail(token: string) {
      // Public — the token comes from the emailed link, no bearer needed.
      const res = await rawFetch('POST', auth('/verify-email'), { body: { token } })
      if (!res.ok) throw await toError(res)
      // If we're signed in, refresh identity so the PENDING_VERIFICATION gate clears.
      if (accessToken) { try { currentUser = await callAuthed<AuthenticatedUser>('GET', '/me') } catch { /* non-fatal */ } }
    },
    async resendVerification() { await callAuthed<{ success: true }>('POST', '/verify-email/resend') },
    me() { return callAuthed<AuthenticatedUser>('GET', '/me') },
    async bootstrap() {
      try { await refresh(); return currentUser } catch { return null }
    },
    async listSessions() {
      const r = await callAuthed<{ sessions: SessionSummary[] }>('GET', '/sessions')
      return r.sessions
    },
    async closeOtherSessions() {
      const r = await callAuthed<{ revoked: number }>('POST', '/sessions/close-all')
      return r.revoked
    },
    totpStatus() { return callAuthed<TotpStatusResponse>('GET', '/totp/status') },
    totpEnrol() { return callAuthed<TotpEnrolmentResponse>('POST', '/totp/enrol') },
    async totpActivate(code: string) {
      const r = await callAuthed<RecoveryCodesResponse>('POST', '/totp/activate', { code })
      // Refresh identity: activating 2FA doesn't change status, but keep currentUser fresh.
      return r.recoveryCodes
    },
    async totpDisable(password: string, code: string) { await callAuthed<{ success: true }>('POST', '/totp/disable', { password, code }) },
    getAccessToken: () => accessToken,
    onSignedOut(cb: () => void) { signedOutCbs.push(cb) },
  }
}
