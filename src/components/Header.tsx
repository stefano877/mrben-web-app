import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { fmt } from '../data'

export default function Header() {
  const app = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])
  const goPage = (p: 'affiliates') => { app.setPage(p); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const goLegal = (k: string) => { app.openLegal(k); setMenuOpen(false) }

  const active =
    app.page === 'sports' ? 'Sportsbook'
      : app.page === 'offers' ? 'Offers'
        : app.page === 'vip' ? 'VIP'
          : app.lobbyView.mode === 'favs' ? 'My Games'
            : app.lobbyView.mode === 'cat' && app.lobbyView.cat === 'Live Casino' ? 'Live Casino'
              : 'Casino'

  const nav = (name: string) => {
    switch (name) {
      case 'Casino': return app.goLobby()
      case 'Live Casino': return app.goLobby({ mode: 'cat', cat: 'Live Casino' })
      case 'My Games': return app.user ? app.goLobby({ mode: 'favs', cat: '' }) : app.setAuthModal('login')
      case 'Sportsbook': return app.setPage('sports')
      case 'Offers': return app.setPage('offers')
      case 'VIP': return app.setPage('vip')
    }
  }
  const NAV = ['Casino', 'Live Casino', 'Sportsbook', 'My Games', 'Offers', 'VIP']

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <div className="wrap nav">
        <div className="brand" onClick={() => app.goLobby()}><img src="/logo.png" alt="MrBen.com" /></div>
        <nav className="menu">
          {NAV.map(n => <a key={n} className={active === n ? 'on' : ''} onClick={() => nav(n)}>{n}</a>)}
        </nav>
        <div className="nav-right">
          <div className="trustbadge">
            <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            Licensed &amp; regulated
          </div>
          {app.user
            ? <div className="bal-chip" onClick={() => app.openModal({ type: 'wallet' })}><span>{fmt(app.user.balance)}</span><span className="plus">+</span></div>
            : <>
              <span className="login" onClick={() => app.setAuthModal('login')}>Login</span>
              <button className="btn-join" onClick={() => app.setAuthModal('join')}>Join</button>
            </>}
          {app.user && <div className="acct-btn" onClick={() => app.openModal({ type: 'account' })} title="Account">{(app.user.username || app.user.email)[0].toUpperCase()}</div>}
          <div className="globe" onClick={() => app.showToast('Language / region')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16244A" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
          </div>
          <div className="more-wrap" ref={menuRef}>
            <button className="more-btn" aria-label="More" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#16244A"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
            </button>
            {menuOpen && (
              <div className="more-menu" role="menu">
                <button role="menuitem" onClick={() => goPage('affiliates')}>Affiliate Program</button>
                <button role="menuitem" onClick={() => goLegal('rg-policy')}>Responsible Gambling</button>
                <button role="menuitem" onClick={() => goLegal('support')}>Support</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
