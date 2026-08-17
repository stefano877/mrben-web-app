// Single integration seam. The whole app talks to `api`; nothing else knows
// whether it is hitting localStorage or the real backend.
//
//   • No VITE_API_BASE  -> mock adapter (localStorage). Default, works offline.
//   • VITE_API_BASE set -> http adapter, pointed at Willmer's backend.
//
// To go live against the backend, set VITE_API_BASE in the Vercel env and redeploy.

import { createMockApi } from './mock'
import { createHttpApi } from './http'
import type { MrBenApi } from './contract'

export const API_BASE = import.meta.env.VITE_API_BASE?.trim() || ''
export const API_MODE: 'http' | 'mock' = API_BASE ? 'http' : 'mock'

export const api: MrBenApi = API_MODE === 'http' ? createHttpApi(API_BASE) : createMockApi()

export * from './types'
export type { MrBenApi } from './contract'
