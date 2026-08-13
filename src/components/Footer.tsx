import { useApp } from '../store'

export default function Footer() {
  const app = useApp()
  const soon = (name: string) => app.showToast(`${name} — coming soon`)
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const col1: [string, () => void][] = [
    ['Casino', () => app.goLobby()],
    ['Responsible Gambling', () => (app.user ? app.openModal({ type: 'account' }) : app.setAuthModal('login'))],
    ['Betting Rules', () => soon('Betting Rules')],
    ['Complaints & procedures', () => soon('Complaints & procedures')],
  ]
  const col2: [string, () => void][] = [
    ['Promotional Terms & Conditions', () => soon('Promotional Terms')],
    ['Privacy Policy', () => soon('Privacy Policy')],
    ['Support', () => soon('Support')],
    ['Cookie Settings', () => soon('Cookie Settings')],
  ]
  const col3: [string, () => void][] = [
    ['About Us', () => soon('About Us')],
    ['Terms of Use', () => soon('Terms of Use')],
    ['Contact Us', () => soon('Contact Us')],
  ]

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <button className="foot-pill" onClick={() => app.showToast('Language / region')}>🌐 English</button>
          <button className="foot-pill" onClick={toTop}>↑ Back to top</button>
        </div>

        <div className="foot-cols">
          <div className="foot-col">
            <h4>Play Now</h4>
            {col1.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            {col2.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            {col3.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}
          </div>
        </div>

        <div className="foot-badges">
          <span className="foot-badge"><span className="circ18">18+</span></span>
          <span className="foot-badge">GAMBLING COMMISSION</span>
          <span className="foot-badge">MGA</span>
          <span className="foot-badge">GORDON MOODY</span>
          <span className="foot-badge">BeGambleAware</span>
        </div>

        <div className="foot-legal">
          <div className="cop">© 2026 MrBen — Mr iGaming Group. All rights reserved.</div>
          <p>MrBen is operated by Mr iGaming Group. Company registration number and registered office are displayed here once incorporation is complete.</p>
          <p>
            Licensed and regulated by [regulator] under licence number [licence no. pending]. 18+ only.
            Gambling can be addictive. Play responsibly. For further information read our <a onClick={() => soon('Responsible Gambling policy')}>responsible gambling policy</a>. Underage gambling is an offence.
          </p>
        </div>
      </div>
    </footer>
  )
}
