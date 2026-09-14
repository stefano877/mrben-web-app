import { offers, OHERO } from '../data'
import { promoArt } from '../art'
import { useApp } from '../store'

// A dedicated, shareable terms page for one promotion (?promo=<key>).
export default function PromoPage() {
  const app = useApp()
  const o = offers.find(x => x.key === app.promoKey)

  const claim = () => {
    if (!app.requireAuth()) return
    app.setPage('offers')
    app.openModal({ type: 'wallet' })
    app.showToast('Offer opted in. It applies on your deposit.')
  }

  if (!o) return (
    <div className="wrap">
      <div className="offers-hero"><h2>Promotion not found</h2><p>This offer may have ended.</p></div>
      <button className="btn orange" style={{ width: 'auto' }} onClick={() => app.setPage('offers')}>Back to promotions</button>
    </div>
  )

  const g = OHERO[o.key] || ['#F5A524', '#B23000']
  return (
    <div className="wrap promo-page">
      <button className="promo-back" onClick={() => app.setPage('offers')}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
        All promotions
      </button>

      <div className="jhero" style={{ ['--glow' as string]: g[0] }}>
        <span className="jcard-glow" />
        <div className="jhero-art" dangerouslySetInnerHTML={{ __html: promoArt(o.key) }} />
        <div className="jhero-in">
          <div className="jhero-badges"><span className="jribbon">{o.ribbon}</span><span className="jtag">{o.tag}</span></div>
          <div className="jhero-title">{app.loc(o.title)}</div>
          <div className="jhero-big">{app.loc(o.hero)}</div>
          <div className="jhero-sub">{app.loc(o.heroSub)}</div>
        </div>
      </div>

      <div className="promo-facts">
        {o.facts.map((f, j) => (
          <div className="promo-fact" key={j}>
            <span className="promo-fact-v">{app.loc(f.value)}</span>
            <span className="promo-fact-l">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="promo-card">
        <p className="promo-lead">{app.loc(o.short)}</p>
        <div className="promo-cta">
          <button className="btn orange" style={{ width: 'auto' }} onClick={claim}>Claim now</button>
          <span className="promo-ccy-note">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
            Shown in {app.ccy}
          </span>
        </div>
        <div className="odetails" dangerouslySetInnerHTML={{ __html: app.loc(o.details) }} />
        <div className="promo-fine">{app.loc(o.terms)} Full Promotional and General Terms apply. 18+. Please gamble responsibly.</div>
      </div>
    </div>
  )
}
