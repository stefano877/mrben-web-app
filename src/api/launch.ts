// Game-launch decision for the player site (MRB-37, front-end half).
//
// The backend owns the authoritative launch: POST /v1/games/:id/launch (real,
// authenticated — runs checkAllowed() + geo, returns a short-lived single-use
// aggregator URL) and POST /v1/games/:id/demo (no auth, no wallet). This module
// mirrors the *client-visible* gates so we never open a game we already know will
// be refused, and so `game_launch_attempted` fires with the right outcome.
//
// When SoftGamings' launch endpoint lands, `requestLaunch` swaps its placeholder
// URL for the real call — the gate logic and the analytics event stay put.

import type { Game } from '../data'
import type { Account } from './types'

export type LaunchMode = 'real' | 'demo'
export type LaunchBlock = 'AUTH' | 'GEO' | 'WALLET_PROVISIONING' | 'SELF_EXCLUDED' | 'DEMO_UNAVAILABLE'

export type LaunchResult =
  | { ok: true; mode: LaunchMode; url: string; single: boolean }
  | { ok: false; reason: LaunchBlock; message: string }

// Preview geo-block via ?geoblock=<CC>; real enforcement is at the edge/backend
// and arrives on the launch response as a 403 with a reason code.
function geoBlocked(): string | null {
  try { return new URLSearchParams(window.location.search).get('geoblock') } catch { return null }
}

// The single compliance gate, client side. Demo never checks the wallet or auth
// (R2); real-money launch is refused for a self-excluded or un-provisioned player
// (R3), and geo blocks either (R4).
export function decideLaunch(game: Game, account: Account | null, mode: LaunchMode): LaunchResult {
  const geo = geoBlocked()
  if (geo) return { ok: false, reason: 'GEO', message: `Games are not available to players in ${geo}. This is based on your location.` }

  if (mode === 'real') {
    if (!account) return { ok: false, reason: 'AUTH', message: 'Sign in to play for real money.' }
    if (account.excluded) return { ok: false, reason: 'SELF_EXCLUDED', message: 'Real-money play is closed while your self-exclusion is active. Support can help when it ends.' }
    if (account.walletReady === false) return { ok: false, reason: 'WALLET_PROVISIONING', message: 'Your wallet is still being set up. Real-money play opens as soon as it is ready — you can play in demo meanwhile.' }
  } else if (game.cat === 'Live Casino') {
    // Live games have no demo (R8) — say so clearly rather than open a broken URL.
    return { ok: false, reason: 'DEMO_UNAVAILABLE', message: 'This live game has no demo. Sign in to play it for real.' }
  }

  // Placeholder. Real launch returns a short-lived, single-use aggregator URL
  // carrying our session correlation id, locale and currency (R1/R5/R6).
  const slug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const url = `about:blank#mrben-${mode}-${slug}`
  return { ok: true, mode, url, single: true }
}

// Async wrapper mirroring the eventual network call, so callers are already
// shaped for the swap to POST /v1/games/:id/(launch|demo).
export function requestLaunch(game: Game, account: Account | null, mode: LaunchMode): Promise<LaunchResult> {
  return Promise.resolve(decideLaunch(game, account, mode))
}
