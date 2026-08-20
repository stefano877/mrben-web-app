import { useApp } from '../store'

const PATHS: Record<string, string> = {
  casino: 'M12 3C8 8 4 9 4 13a3.4 3.4 0 0 0 6.4 1.7C10 17 9 18 8 19h8c-1-1-2-2-2.4-4.3A3.4 3.4 0 0 0 20 13c0-4-4-5-8-10z',
  sports: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M3 12h18',
  offers: 'M4 9h16v11H4zM3 5h18v4H3zM12 5v15',
  mygames: 'M12 20s-6.5-4.2-9-7.8C1.3 9.4 3 6 6.3 6 8.7 6 12 9 12 9s3.3-3 5.7-3C21 6 22.7 9.4 21 12.2 18.5 15.8 12 20 12 20z',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0',
}

function BnIcon({ k }: { k: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d={PATHS[k]} />
    </svg>
  )
}

export default function BottomNav() {
  const app = useApp()
  const active =
    app.page === 'sports' ? 'sports'
      : app.page === 'offers' ? 'offers'
        : app.page === 'vip' ? 'vip'
          : app.lobbyView.mode === 'favs' ? 'mygames'
            : 'casino'

  const items: { k: string; label: string; fn: () => void }[] = [
    { k: 'casino', label: 'Casino', fn: () => app.goLobby() },
    { k: 'sports', label: 'Sports', fn: () => app.setPage('sports') },
    { k: 'offers', label: 'Offers', fn: () => app.setPage('offers') },
    { k: 'mygames', label: 'My Games', fn: () => (app.user ? app.goLobby({ mode: 'favs', cat: '' }) : app.setAuthModal('login')) },
    { k: 'account', label: app.user ? 'Account' : 'Sign in', fn: () => (app.user ? app.openModal({ type: 'account' }) : app.setAuthModal('login')) },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.k} className={active === it.k ? 'on' : ''} onClick={it.fn}>
          <span className="bn-ic"><BnIcon k={it.k} /></span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}
