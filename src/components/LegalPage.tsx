import { useApp } from '../store'
import { LEGAL } from '../data/legal'

// Standalone legal/help landing pages, one per policy, each with its own URL
// (?legal=<key>). Reachable from the footer and directly linkable.
const INDEX: [string, string][] = [
  ['terms', 'Terms & Conditions'],
  ['privacy', 'Privacy Policy'],
  ['rg-policy', 'Responsible Gambling'],
  ['self-exclusion', 'Self-exclusion'],
  ['promo-terms', 'Promotional Terms'],
  ['cookies', 'Cookie Settings'],
  ['betting-rules', 'Game Rules'],
  ['complaints', 'Complaints & procedures'],
  ['support', 'Support'],
  ['contact', 'Contact Us'],
  ['about', 'About Us'],
]

export default function LegalPage() {
  const app = useApp()
  const key = app.legalKey && LEGAL[app.legalKey] ? app.legalKey : 'terms'
  const doc = LEGAL[key]
  return (
    <main className="legal-page">
      <div className="wrap legal-wrap">
        <nav className="legal-nav">
          <div className="legal-nav-h">Legal &amp; help</div>
          {INDEX.map(([k, t]) => (
            <button key={k} className={'legal-nav-a' + (k === key ? ' on' : '')} onClick={() => app.openLegal(k)}>{t}</button>
          ))}
        </nav>
        <article className="legal-content">
          <div className="legal-crumb"><button onClick={() => app.goLobby()}>Home</button><span>/</span><span>Legal</span><span>/</span><b>{doc.title}</b></div>
          <h1 className="legal-title">{doc.title}</h1>
          <div className="doc" dangerouslySetInnerHTML={{ __html: doc.html }} />
          {key === 'rg-policy' && (
            <button className="btn orange legal-cta" onClick={() => { if (app.user) app.openModal({ type: 'account' }); else app.setAuthModal('login') }}>Manage my limits</button>
          )}
          {key === 'self-exclusion' && (
            <button className="btn orange legal-cta" onClick={() => { if (app.user) app.openModal({ type: 'account' }); else app.setAuthModal('login') }}>Self-exclude from my account</button>
          )}
          {key === 'cookies' && (
            <div className="row2 legal-cta"><button className="btn sec" onClick={() => app.showToast('Essential cookies only')}>Essential only</button><button className="btn orange" onClick={() => app.showToast('All cookies accepted')}>Accept all</button></div>
          )}
          <div className="legal-back"><button className="btn ghost" onClick={() => app.goLobby()}>← Back to casino</button></div>
        </article>
      </div>
    </main>
  )
}
