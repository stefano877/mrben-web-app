# MrBen front end ↔ backend integration

The whole player app talks to a single seam: `src/api`. Nothing else in the UI
knows whether it is hitting localStorage or a real server. To go live against the
backend you set one environment variable and implement the endpoints below.

## Switching to the backend

- **Mock mode (default):** `VITE_API_BASE` unset → `src/api/mock.ts`, backed by
  `localStorage`. This is what runs on Vercel today, so the demo works with no server.
- **Live mode:** set `VITE_API_BASE=https://api.mrben.com` in the Vercel project env
  and redeploy → `src/api/http.ts` takes over. No component code changes.

## Auth

- `register` and `login` return `{ token, account }`. The client stores `token` and
  sends it as `Authorization: Bearer <token>` on every subsequent request.
- A `401` clears the stored token and drops the user to logged-out.

## Idempotency

Every mutating request (everything except `GET /session`) carries a unique
`Idempotency-Key` header. Retries (network drops, double taps) must not double-charge
a wallet or double-settle a bet — key the write on that header.

## Money

Amounts are currently major units (euros) as plain numbers. `project.md` DEC-008 / C-16
defines the move to integer minor units; the backend should own that and can return
minor units once both sides switch. Balances and bonuses are separate wallets.

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/session` | – | `Session` or `null` |
| POST | `/auth/register` | `{ email, pass, profile }` | `Session` |
| POST | `/auth/login` | `{ email, pass }` | `Session` |
| POST | `/auth/logout` | – | `204` |
| POST | `/wallet/deposit` | `{ amount, method }` | `{ account, bonusAdded }` |
| POST | `/wallet/withdraw` | `{ amount, method }` | `Account` |
| POST | `/game/bet` | `{ gameId, gameName, bet }` | `{ account, win }` |
| POST | `/game/rollback` | `{ amount }` | `Account` |
| POST | `/bonus/wheel` | – | `{ account, index, prize }` |
| POST | `/bonus/chest` | – | `{ account, prize }` |
| PUT | `/rg/limits/:kind` | `{ value }` | `{ account, outcome }` |
| DELETE | `/rg/limits/:kind/pending` | – | `Account` |
| POST | `/rg/self-exclude` | `{ period }` | `Account` |
| POST | `/rg/self-exclude/lift` | – | `Account` |
| PUT | `/rg/reality-checks` | `{ on }` | `Account` |
| PUT | `/me/favourites` | `{ favs }` | `Account` |
| PUT | `/me/recent` | `{ recent }` | `Account` |

`kind` is one of `deposit | loss | session`. `outcome` is `lowered | scheduled`
(decreases apply now; increases are scheduled 24h out and returned in `account.pending`).
The bet outcome is **server-authoritative** — the client sends the stake, the server
decides `win`. The wheel returns the winning segment `index` so the client can animate to it.

## Types

The exact request/response shapes are in `src/api/types.ts` (`Account`, `Session`,
`Txn`, `Profile`, `Limits`, etc.) and the method list is `src/api/contract.ts`
(`MrBenApi`). Those two files are the contract of record — match them and the front
end plugs in unchanged.

## Errors

Non-2xx responses should return `{ code, message }`. `message` is shown to the player;
`code` is a stable identifier (e.g. `insufficient`, `underage`, `username_taken`,
`already_claimed`). See `ApiError` in `types.ts`.
