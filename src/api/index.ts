// Single integration seam. The whole app talks to `api`; nothing else knows
// whether it is hitting localStorage or the real backend.
//
//   • No VITE_API_BASE  -> mock adapter (localStorage). Default, works offline.
//   • VITE_API_BASE set -> backend adapter: real auth against Willmer's API,
//     wallet/games kept as local demo and gated on walletReady until those
//     endpoints land.
//
// To go live against the backend, set VITE_API_BASE in the Vercel env and redeploy.

import { createMockApi } from './mock'
import { createBackendApi } from './backend'
import type { MrBenApi } from './contract'

export const API_BASE = import.meta.env.VITE_API_BASE?.trim() || ''
export const API_MODE: 'backend' | 'mock' = API_BASE ? 'backend' : 'mock'

export const api: MrBenApi = API_MODE === 'backend' ? createBackendApi(API_BASE) : createMockApi()

export * from './types'
export type { MrBenApi } from './contract'
