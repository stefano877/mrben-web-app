import { AppProvider, useApp } from './store'
import Header from './components/Header'
import SideDots from './components/SideDots'
import Ticker from './components/Ticker'
import Lobby from './components/Lobby'
import OffersPage from './components/OffersPage'
import Sportsbook from './components/Sportsbook'
import VipPage from './components/VipPage'
import Modals from './components/Modals'

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
      <footer>
        <div className="wrap">
          <div className="rg"><span>18+</span><span>Play responsibly</span><span>BeGambleAware.org</span><span>SSL secured</span></div>
          MrBen player site, React prototype. Accounts and balances are saved in your browser only. · Mr iGaming Group
        </div>
      </footer>
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
