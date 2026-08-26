import { useApp } from '../store'

export default function Footer() {
  const app = useApp()
  const open = (key: string) => app.openModal({ type: 'info', key })
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const col1: [string, () => void][] = [
    ['Casino', () => app.goLobby()],
    ['Responsible Gambling', () => open('rg-policy')],
    ['Self-exclusion', () => open('self-exclusion')],
    ['Game Rules', () => open('betting-rules')],
    ['Complaints & procedures', () => open('complaints')],
  ]
  const col2: [string, () => void][] = [
    ['Terms & Conditions', () => open('terms')],
    ['Promotional Terms', () => open('promo-terms')],
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

        <div className="pay-row">
          <span className="pay-logo"><span className="pw" style={{ fontStyle: 'italic' }}>VISA</span></span>
          <span className="pay-logo" aria-label="Mastercard"><svg width="30" height="20" viewBox="0 0 30 20"><circle cx="12" cy="10" r="8" fill="currentColor" opacity="0.5" /><circle cx="19" cy="10" r="8" fill="currentColor" opacity="0.85" /></svg></span>
          <span className="pay-logo"><span className="pw">₿ BTC</span></span>
          <span className="pay-logo"><svg width="13" height="20" viewBox="0 0 14 22" fill="currentColor" aria-label="Ethereum"><path d="M7 0 0 11l7 4 7-4zM0 12.4 7 22l7-9.6-7 4z" /></svg><span className="pw">ETH</span></span>
          <span className="pay-logo"><span className="pw">₮ USDT</span></span>
          <span className="pay-logo" aria-label="Local bank transfer"><svg width="22" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-6 9 6M4 10v9M20 10v9M4 20h16M8 13v4M12 13v4M16 13v4" /></svg></span>
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
