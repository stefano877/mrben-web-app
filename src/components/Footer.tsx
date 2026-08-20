import { useApp } from '../store'

export default function Footer() {
  const app = useApp()
  const open = (key: string) => app.openModal({ type: 'info', key })
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const col1: [string, () => void][] = [
    ['Casino', () => app.goLobby()],
    ['Responsible Gambling', () => open('rg-policy')],
    ['Betting Rules', () => open('betting-rules')],
    ['Complaints & procedures', () => open('complaints')],
  ]
  const col2: [string, () => void][] = [
    ['Promotional Terms & Conditions', () => open('promo-terms')],
    ['Privacy Policy', () => open('privacy')],
    ['Support', () => open('support')],
    ['Cookie Settings', () => open('cookies')],
  ]
  const col3: [string, () => void][] = [
    ['About Us', () => open('about')],
    ['Terms of Use', () => open('terms')],
    ['Contact Us', () => open('contact')],
  ]

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <button className="foot-pill" onClick={() => app.showToast('Language / region')}>English</button>
          <button className="foot-pill" onClick={toTop}>Back to top</button>
        </div>

        <div className="foot-cols">
          <div className="foot-col"><h4>Play Now</h4>{col1.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}</div>
          <div className="foot-col"><h4>Help</h4>{col2.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}</div>
          <div className="foot-col"><h4>Company</h4>{col3.map(([t, fn]) => <a key={t} onClick={fn}>{t}</a>)}</div>
        </div>

        <div className="foot-badges">
          <span className="foot-badge"><span className="circ18">18+</span></span>
          <span className="foot-badge">ANJOUAN LICENSED</span>
          <span className="foot-badge" onClick={() => open('rg-policy')} style={{ cursor: 'pointer' }}>RESPONSIBLE GAMING</span>
          <span className="foot-badge">SSL SECURE</span>
        </div>

        <div className="foot-legal">
          <div className="cop">© 2026 MrBen — Mr iGaming Group. All rights reserved.</div>
          <p>MrBen is operated by Mr iGaming Group. Company registration number and registered office are displayed here once incorporation is complete.</p>
          <p>
            Licensed and regulated under the Anjouan Gaming Licence (Union of the Comoros), licence number [pending]. 18+ only.
            Gambling can be addictive. Play responsibly. For more information read our <a onClick={() => open('rg-policy')}>responsible gambling policy</a>. Underage gambling is an offence.
          </p>
        </div>
      </div>
    </footer>
  )
}
