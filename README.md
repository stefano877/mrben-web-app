# MrBen — Player Site (React)

The MrBen player site rebuilt as a real front-end app: **React 19 + Vite + TypeScript + Tailwind v4**, componentized, matching the `project.md` stack. This is the lobby (first pass) — header, offers ticker, promotions, auto-scrolling Best Games and Providers, category filters, search, favourites, and a Join/Login modal. Offers/Sportsbook/VIP/wallet screens come next.

## Run it

You need [Node.js](https://nodejs.org) 20+ installed. Then, in this folder:

```bash
npm install     # first time only — downloads dependencies
npm run dev      # starts the live dev server
```

Open the URL it prints (usually **http://localhost:5173**). The page reloads automatically as files change.

Other commands:

```bash
npm run build      # production build into dist/
npm run preview    # preview the production build
npm run typecheck  # TypeScript check, no output
```

## Structure

```
src/
├── main.tsx            # entry
├── App.tsx             # page + state (favourites, search, filter, auth modal)
├── index.css           # brand styles + animations
├── data.ts             # games, offers, providers, categories (mock)
├── art.ts              # generated SVG game covers + promo art
└── components/
    ├── Header.tsx  SideDots.tsx  Ticker.tsx  Promos.tsx
    ├── Providers.tsx  CategoryBar.tsx
    └── GameRow.tsx  GameCard.tsx
public/
├── logo.png            # MrBen lockup
└── mascot.png          # Ben mascot
```

## Notes
- All data is mock and in-memory. In production these become calls to the Backend API (`/v1`).
- Game covers are generated as vector art. Set a `img` on a game in `data.ts` to use a real thumbnail instead — the card uses it automatically.
- Drops into the Nx monorepo as `apps/web` with no rework.
