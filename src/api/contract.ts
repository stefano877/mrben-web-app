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
  WheelResult, ChestResult, LimitResult, LimitKind,
} from './types'

export interface MrBenApi {
  // ---- auth / session ----
  getSession(): Promise<Session | null>
  register(input: RegisterInput): Promise<Session>
  login(email: string, pass: string): Promise<Session>
  logout(): Promise<void>
  /** Request a reset link. Resolves the same way whether or not the email exists (no account enumeration). */
  requestPasswordReset(email: string): Promise<void>
  /** Set a new password using a single-use token from the email link. */
  resetPassword(token: string, newPass: string): Promise<void>

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
}
