import { useApp } from '../store'

export default function BottomNav() {
  const app = useApp()
  const active =
    app.page === 'sports' ? 'sports'
      : app.page === 'offers' ? 'offers'
        : app.page === 'vip' ? 'vip'
          : app.lobbyView.mode === 'favs' ? 'mygames'
            : 'casino'

  const items: { k: string; label: string; icon: string; fn: () => void }[] = [
    { k: 'casino', label: 'Casino', icon: '🎰', fn: () => app.goLobby() },
    { k: 'sports', label: 'Sports', icon: '⚽', fn: () => app.setPage('sports') },
    { k: 'offers', label: 'Offers', icon: '🎁', fn: () => app.setPage('offers') },
    { k: 'mygames', label: 'My Games', icon: '❤️', fn: () => (app.user ? app.goLobby({ mode: 'favs', cat: '' }) : app.setAuthModal('login')) },
    { k: 'account', label: app.user ? 'Account' : 'Sign in', icon: '👤', fn: () => (app.user ? app.openModal({ type: 'account' }) : app.setAuthModal('login')) },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.k} className={active === it.k ? 'on' : ''} onClick={it.fn}>
          <span className="bn-ic">{it.icon}</span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}
