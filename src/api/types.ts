// MrBen player-facing API — shared types (§11.0 contract)
// These DTOs are the boundary between the front end and Willmer's backend.
// In mock mode they are produced locally; in HTTP mode the backend returns them.

import type { UserStatus, UserRole } from './auth/types'

export type TxnKind = 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus'
export interface Txn { id: number; kind: TxnKind; amount: number; label: string; at: number }

export interface Profile {
  username: string
  dob: string        // ISO date, player must be 18+
  phone: string      // full international, e.g. "+44 7700 900000"
  country: string    // ISO-3166 alpha-2
  dial: string       // dial code without +
  marketing: boolean
}

export type LimitKind = 'deposit' | 'loss' | 'session'
export interface Limits { deposit: number; loss: number; session: number }
export type PendingLimits = { [K in LimitKind]?: { value: number; at: number } }

/**
 * The full account view the UI renders. Never contains the password.
 * Money fields are major units (euros) for now; see project.md DEC-008/C-16
 * for the minor-units migration the backend should own.
 */
export interface Account {
  email: string
  username: string
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
  rc: boolean               // reality checks on/off
  excluded: boolean         // self-excluded
  wheelClaimed: boolean
  chestClaimed: boolean
  firstDepositDone: boolean
  limits: Limits
  pending: PendingLimits    // increases scheduled 24h out, cancellable
  // Identity fields present only when authenticated against the real backend.
  // Undefined in local mock/demo mode (treated as a fully-enabled demo player).
  id?: string
  status?: UserStatus
  role?: UserRole
  emailVerified?: boolean
  /**
   * False while the provider wallet is being provisioned (waiting on the PAM
   * deal). Gate deposits and real-money play on this. Undefined = demo, allowed.
   */
  walletReady?: boolean
}

export interface Session { token: string; account: Account }

export interface RegisterInput { email: string; pass: string; profile: Profile }

export interface DepositResult { account: Account; bonusAdded: number }
export interface BetResult { account: Account; win: number }
export interface WheelResult { account: Account; index: number; prize: string }
export interface ChestResult { account: Account; prize: string }
export interface LimitResult { account: Account; outcome: 'lowered' | 'scheduled' }

/** Thrown by any adapter on a failed call. `code` is stable; `message` is user-facing. */
export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}
