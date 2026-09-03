import { useEffect } from 'react'
import { AppProvider, useApp } from './store'
import { pageView } from './analytics'
import { applySeo } from './seo'
import { loadMarketingTags } from './marketing'
import { LEGAL } from './data/legal'
import Header from './components/Header'
import SideDots from './components/SideDots'
import Ticker from './components/Ticker'
import Lobby from './components/Lobby'
import OffersPage from './components/OffersPage'
import Sportsbook from './components/Sportsbook'
import VipPage from './components/VipPage'
import Modals from './components/Modals'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import CookieConsent from './components/CookieConsent'
import RealityCheck from './components/RealityCheck'
import RegionBlock, { previewBlockedRegion } from './components/RegionBlock'
import LegalPage from './components/LegalPage'
import AffiliatePromo from './components/AffiliatePromo'

function Shell() {
  const app = useApp()
  // Automatic page views (MRB-100 R2) — fire page_viewed on every route change,
  // including first load, so it can't be forgotten per-page.
  useEffect(() => {
    const path = app.page === 'lobby' ? '/'
      : app.page === 'legal' ? `/legal/${app.legalKey}`
      : `/${app.page}`
    pageView(path)
  }, [app.page, app.legalKey])
  // Load marketing tags on boot if the player already accepted all cookies (MRB-96).
  useEffect(() => { loadMarketingTags() }, [])
  // Keep title, description and canonical accurate as the SPA navigates (MRB-96).
  useEffect(() => {
    const legalTitle = app.page === 'legal' ? LEGAL[app.legalKey]?.title : undefined
    applySeo(app.page, { legalTitle, legalKey: app.legalKey })
  }, [app.page, app.legalKey])
  // Escape dismisses whichever dialog is open — keyboard users must be able to
  // leave a modal without a mouse (WCAG 2.1.2 no keyboard trap, MRB-98).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (app.modal) app.closeModal()
      else if (app.authModal) app.setAuthModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [app.modal, app.authModal])
  // Region-unavailable screen. Preview only here (?geoblock=US); real geo-blocking
  // is enforced at the edge and backend, which will pass the decision in.
  const blockedRegion = previewBlockedRegion()
  if (blockedRegion) return <RegionBlock country={blockedRegion} />
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SideDots />
      <Header />
      <Ticker />
      <main id="main-content">
      {app.page === 'lobby' && <Lobby />}
      {app.page === 'offers' && <OffersPage />}
      {app.page === 'sports' && <Sportsbook />}
      {app.page === 'vip' && <VipPage />}
      {app.page === 'legal' && <LegalPage />}
      {app.page === 'affiliates' && <AffiliatePromo />}
      </main>
      <Footer />
      <button className="wheel-fab" onClick={() => { if (app.requireAuth()) app.openModal({ type: 'wheel' }) }} aria-label="Daily bonus wheel">
        <span className="tagn">1</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M4 12v9h16v-9M12 8S10 3 7.5 4.2C5.4 5.3 7 8 12 8ZM12 8s2-5 4.5-3.8C18.6 5.3 17 8 12 8Z" />
        </svg>
      </button>
      <Modals />
      <RealityCheck />
      <CookieConsent />
      <BottomNav />
      <div className={'toast' + (app.toast ? ' show' : '')} role="status" aria-live="polite" aria-atomic="true">{app.toast}</div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
