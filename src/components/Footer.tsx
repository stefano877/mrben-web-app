import { useApp } from '../store'

export default function Footer() {
  const app = useApp()
  const open = (key: string) => app.openLegal(key)
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // [react key, translation key, English fallback, handler]
  const col1: [string, string, string, () => void][] = [
    ['casino', 'nav.casino', 'Casino', () => app.goLobby()],
    ['rg', 'menu.rg', 'Responsible Gambling', () => open('rg-policy')],
    ['self-exclusion', 'footer.selfExclusion', 'Self-exclusion', () => open('self-exclusion')],
    ['game-rules', 'footer.gameRules', 'Game Rules', () => open('betting-rules')],
    ['complaints', 'footer.complaints', 'Complaints & procedures', () => open('complaints')],
  ]
  const col2: [string, string, string, () => void][] = [
    ['terms', 'footer.terms', 'Terms & Conditions', () => open('terms')],
    ['promo-terms', 'footer.promoTerms', 'Promotional Terms', () => open('promo-terms')],
    ['privacy', 'footer.privacy', 'Privacy Policy', () => open('privacy')],
    ['support', 'menu.support', 'Support', () => open('support')],
    ['cookies', 'footer.cookieSettings', 'Cookie Settings', () => open('cookies')],
  ]
  const col3: [string, string, string, () => void][] = [
    ['about', 'footer.about', 'About Us', () => open('about')],
    ['terms-of-use', 'footer.termsOfUse', 'Terms of Use', () => open('terms')],
    ['contact', 'footer.contact', 'Contact Us', () => open('contact')],
  ]

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <button className="foot-pill" onClick={() => app.showToast(app.t('footer.langRegion', 'Language / region'))}>English</button>
          <button className="foot-pill" onClick={toTop}>{app.t('footer.top', 'Back to top')}</button>
        </div>

        <div className="foot-cols">
          <div className="foot-col"><h4>{app.t('footer.col.play', 'Play Now')}</h4>{col1.map(([k, tk, fb, fn]) => <a key={k} onClick={fn}>{app.t(tk, fb)}</a>)}</div>
          <div className="foot-col"><h4>{app.t('footer.col.help', 'Help')}</h4>{col2.map(([k, tk, fb, fn]) => <a key={k} onClick={fn}>{app.t(tk, fb)}</a>)}</div>
          <div className="foot-col"><h4>{app.t('footer.col.company', 'Company')}</h4>{col3.map(([k, tk, fb, fn]) => <a key={k} onClick={fn}>{app.t(tk, fb)}</a>)}</div>
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
          <span className="foot-badge">{app.t('footer.badge.anjouan', 'ANJOUAN LICENSED')}</span>
          <span className="foot-badge" onClick={() => open('rg-policy')} style={{ cursor: 'pointer' }}>{app.t('footer.badge.rg', 'RESPONSIBLE GAMING')}</span>
          <span className="foot-badge">{app.t('footer.badge.ssl', 'SSL SECURE')}</span>
        </div>

        <div className="foot-legal">
          <div className="cop">{app.t('footer.copyright', '© 2026 MrBen — Mr iGaming Group. All rights reserved.')}</div>
          <p>{app.t('footer.legal1', 'MrBen is operated by Mr iGaming Group. Company registration number and registered office are displayed here once incorporation is complete.')}</p>
          <p>
            {app.t('footer.legal2a', 'Licensed and regulated under the Anjouan Gaming Licence (Union of the Comoros), licence number [pending]. 18+ only. Gambling can be addictive. Play responsibly. For more information read our ')}
            <a onClick={() => open('rg-policy')}>{app.t('footer.legal2link', 'responsible gambling policy')}</a>
            {app.t('footer.legal2b', '. Underage gambling is an offence.')}
          </p>
        </div>
      </div>
    </footer>
  )
}
