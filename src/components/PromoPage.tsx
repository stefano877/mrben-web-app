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
      <div className="offers-head"><h2>Promotion not found</h2><p>This offer may have ended.</p></div>
      <button className="btn orange" style={{ width: 'auto' }} onClick={() => app.setPage('offers')}>Back to promotions</button>
    </div>
  )

  const g = OHERO[o.key] || ['#333', '#111']
  return (
    <div className="wrap promo-page">
      <div className="ohero" style={{ height: 150, borderRadius: 18, marginBottom: 16, backgroundImage: `linear-gradient(120deg,${g[0]},${g[1]})` }}>
        <span className="sheen" />
        <span className="otag">{o.tag}</span>
        <div className="ohead" style={{ fontSize: 26 }}>{o.title}</div>
        <div className="p-art" dangerouslySetInnerHTML={{ __html: promoArt(o.key) }} />
      </div>
      <div className="promo-card">
        <p style={{ marginTop: 0, fontSize: 15, color: '#3a4056' }}>{o.short}</p>
        <div style={{ display: 'flex', gap: 10, margin: '4px 0 16px', flexWrap: 'wrap' }}>
          <button className="btn orange" style={{ width: 'auto' }} onClick={claim}>Claim now</button>
          <button className="btn sec" style={{ width: 'auto' }} onClick={() => app.setPage('offers')}>All promotions</button>
        </div>
        <div className="odetails" dangerouslySetInnerHTML={{ __html: o.details }} />
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>{o.terms}</p>
      </div>
    </div>
  )
}
