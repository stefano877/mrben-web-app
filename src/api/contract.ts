// MrBen player-facing API — the interface every adapter implements.
// mock.ts (localStorage) and http.ts (real backend) both satisfy MrBenApi,
// so swapping one for the other is a config change, not a rewrite.
//
// REST mapping each method targets in HTTP mode (see api/README.md):
//   getSession          GET    /session
//   register            POST   /auth/register
//   login               POST   /auth/login
//   logout              POST   /auth/logout
//   requestPasswordReset POST  /auth/forgot-password   (always 204, no enumeration)
//   resetPassword       POST   /auth/reset-password    (single-use token, invalidates sessions)
//   deposit             POST   /wallet/deposit
//   withdraw            POST   /wallet/withdraw
//   placeBet            POST   /game/bet
//   rollback            POST   /game/rollback
//   spinWheel           POST   /bonus/wheel
//   openChest           POST   /bonus/chest
//   setLimit            PUT    /rg/limits/:kind
//   cancelPendingLimit  DELETE /rg/limits/:kind/pending
//   selfExclude         POST   /rg/self-exclude
//   liftExclusion       POST   /rg/self-exclude/lift
//   setRealityChecks    PUT    /rg/reality-checks
//   setFavourites       PUT    /me/favourites
//   setRecent           PUT    /me/recent

import type {
  Account, Session, RegisterInput, DepositResult, BetResult,
  WheelResult, ChestResult, LimitResult, LimitKind, LoginResult,
  SessionSummary, TotpStatusResponse, TotpEnrolmentResponse,
} from './types'

export interface MrBenApi {
  // ---- auth / session ----
  getSession(): Promise<Session | null>
  register(input: RegisterInput): Promise<Session>
  /** May resolve to a session OR a TOTP challenge — callers must branch (isLoginChallenge). */
  login(email: string, pass: string): Promise<LoginResult>
  logout(): Promise<void>
  /** Request a reset link. Resolves the same way whether or not the email exists (no account enumeration). */
  requestPasswordReset(email: string): Promise<void>
  /** Set a new password using a single-use token from the email link. */
  resetPassword(token: string, newPass: string): Promise<void>

  // ---- second factor, email verification, sessions (backend mode only; optional) ----
  /** Complete a login that returned a TOTP challenge. */
  verifyTotp?(code: string): Promise<Session>
  /** Verify an email address with the token from the emailed link. */
  verifyEmail?(token: string): Promise<void>
  /** Resend the verification email to the signed-in player. */
  resendVerification?(): Promise<void>
  /** The player's live sessions. */
  listSessions?(): Promise<SessionSummary[]>
  /** Sign out every other session; returns how many were revoked. */
  closeOtherSessions?(): Promise<number>
  totpStatus?(): Promise<TotpStatusResponse>
  totpEnrol?(): Promise<TotpEnrolmentResponse>
  /** Activate an enrolled factor; returns the one-time recovery codes. */
  totpActivate?(code: string): Promise<string[]>
  totpDisable?(password: string, code: string): Promise<void>
  /** Subscribe to session death (revoked elsewhere, refresh failed). */
  onSignedOut?(cb: () => void): void

  // ---- wallet ----
  deposit(amount: number, method: string): Promise<DepositResult>
  withdraw(amount: number, method: string): Promise<Account>

  // ---- game play (server-authoritative outcome) ----
  placeBet(gameId: string, gameName: string, bet: number): Promise<BetResult>
  rollback(amount: number): Promise<Account>

  // ---- engagement ----
  spinWheel(): Promise<WheelResult>
  openChest(): Promise<ChestResult>

  // ---- responsible gambling ----
  setLimit(kind: LimitKind, value: number): Promise<LimitResult>
  cancelPendingLimit(kind: LimitKind): Promise<Account>
  selfExclude(period: string): Promise<Account>
  liftExclusion(): Promise<Account>
  setRealityChecks(on: boolean): Promise<Account>

  // ---- personalization ----
  setFavourites(favs: string[]): Promise<Account>
  setRecent(recent: string[]): Promise<Account>

  /**
   * The current access token, held in memory (never persisted — project.md
   * §11.0 v2.3). Used to attach a bearer to the analytics identify call. Optional
   * because the mock adapter has no real session. Backend mode returns the live token.
   */
  getToken?(): string | null
}
