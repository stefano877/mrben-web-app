import { useState } from 'react'
import { offers, offerTabs, OHERO } from '../data'
import type { Offer } from '../data'
import { promoArt } from '../art'
import { useApp } from '../store'

export default function OffersPage() {
  const app = useApp()
  const [filter, setFilter] = useState('All')
  const [detail, setDetail] = useState<Offer | null>(null)
  const list = offers.filter(o => filter === 'All' || o.tag === filter)

  const claim = () => {
    if (!app.requireAuth()) { setDetail(null); return }
    setDetail(null)
    app.openModal({ type: 'wallet' })
    app.showToast('Offer opted in. It applies on your deposit.')
  }

  return (
    <div className="wrap">
      <div className="offers-head"><h2>Promotions</h2><p>Bonuses, free spins and rewards. Grab what’s yours.</p></div>
      <div className="otabs">
        {offerTabs.map(t => <div key={t} className={'otab' + (t === filter ? ' on' : '')} onClick={() => setFilter(t)}>{t}</div>)}
      </div>
      <div className="offers-grid">
        {list.map((o, i) => {
          const g = OHERO[o.key] || ['#333', '#111']
          return (
            <div className="offer" key={i}>
              <div className="ohero" style={{ backgroundImage: `linear-gradient(120deg,${g[0]},${g[1]})` }}>
                <span className="sheen" />
                <span className="otag">{o.tag}</span>
                <div className="ohead">{o.title}</div>
                <div className="p-art" dangerouslySetInnerHTML={{ __html: promoArt(o.key) }} />
              </div>
              <div className="obody">
                <p className="odesc">{o.short}</p>
                <div className="obtns">
                  <button className="btn sec small" onClick={() => setDetail(o)}>More info</button>
                  <button className="btn orange small" onClick={claim}>Claim now</button>
                </div>
                <div className="oterms">{o.terms}</div>
              </div>
            </div>
          )
        })}
      </div>

      {detail && (
        <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="modal">
            <div className="ohero" style={{ height: 130, backgroundImage: `linear-gradient(120deg,${(OHERO[detail.key] || ['#333', '#111'])[0]},${(OHERO[detail.key] || ['#333', '#111'])[1]})` }}>
              <span className="sheen" />
              <span className="otag">{detail.tag}</span>
              <div className="ohead" style={{ fontSize: 22 }}>{detail.title}</div>
              <div className="p-art" dangerouslySetInnerHTML={{ __html: promoArt(detail.key) }} />
              <button className="x xabs" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="odetails" dangerouslySetInnerHTML={{ __html: detail.details }} />
              <button className="btn orange" onClick={claim}>Claim now</button>
              <p className="muted" style={{ fontSize: 11, margin: '12px 0 0' }}>{detail.terms}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
