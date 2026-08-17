// Mirror of @mrben/shared-types (auth + errors) from the backend monorepo.
// While the player site is a standalone Vercel app it can't import the workspace
// package, so these are hand-kept in sync with packages/shared-types. When the
// site moves into the Nx monorepo as apps/web, delete this file and import
// `@mrben/shared-types` instead — that's the point of the shared package.
//
// Source of truth: mrben-backend/packages/shared-types/src/lib/{auth,errors}.ts

export const MIN_PASSWORD_LENGTH = 12
export const MIN_AGE_YEARS = 18
export const REFRESH_COOKIE_NAME = 'mrben_rt'

export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'PROVIDER_SYNC_PENDING'
  | 'SUSPENDED'
  | 'SELF_EXCLUDED'
  | 'CLOSED'

export type UserRole = 'PLAYER' | 'SUPPORT' | 'FINANCE' | 'ADMIN'

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  country: string
  status: UserStatus
  role: UserRole
  emailVerified: boolean
  /** False until a provider wallet is provisioned — gate wallet/real-money UI on this (§5.3). */
  walletReady: boolean
  createdAt: string
}

export interface AuthSessionResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number // seconds; 900 = 15 min
  user: AuthenticatedUser
}

export interface Attribution {
  clickId?: string; source?: string; medium?: string; campaign?: string
  term?: string; content?: string; referrer?: string; landingPage?: string
}

export interface RegisterRequest {
  email: string
  username: string        // 3-20, [a-zA-Z0-9_]
  password: string        // min 12
  country: string         // ISO 3166-1 alpha-2
  dob: string             // YYYY-MM-DD
  phone: string           // E.164, e.g. +447700900123
  marketing?: boolean     // defaults false server-side
  attribution?: Attribution
}

export interface SessionSummary {
  id: string
  current: boolean
  userAgent: string | null
  createdAt: string
  expiresAt: string
}

// Every error code the auth surface can return. Switch on `code`, never message.
export const AUTH_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  UNDERAGE: 'UNDERAGE',
  COUNTRY_BLOCKED: 'COUNTRY_BLOCKED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

export interface FieldError { path: string; message: string }
