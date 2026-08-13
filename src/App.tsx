import { AppProvider, useApp } from './store'
import Header from './components/Header'
import SideDots from './components/SideDots'
import Ticker from './components/Ticker'
import Lobby from './components/Lobby'
import OffersPage from './components/OffersPage'
import Sportsbook from './components/Sportsbook'
import VipPage from './components/VipPage'
import Modals from './components/Modals'
import Footer from './components/Footer'

function Shell() {
  const app = useApp()
  return (
    <div className="app">
      <SideDots />
      <Header />
      <Ticker />
      {app.page === 'lobby' && <Lobby />}
      {app.page === 'offers' && <OffersPage />}
      {app.page === 'sports' && <Sportsbook />}
      {app.page === 'vip' && <VipPage />}
      <Footer />
      <button className="wheel-fab" onClick={() => { if (app.requireAuth()) app.openModal({ type: 'wheel' }) }} aria-label="Daily bonus wheel">
        <span className="tagn">1</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M4 12v9h16v-9M12 8S10 3 7.5 4.2C5.4 5.3 7 8 12 8ZM12 8s2-5 4.5-3.8C18.6 5.3 17 8 12 8Z" />
        </svg>
      </button>
      <Modals />
      <div className={'toast' + (app.toast ? ' show' : '')}>{app.toast}</div>
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
