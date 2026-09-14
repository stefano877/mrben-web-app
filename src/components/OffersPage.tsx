import { useState } from 'react'
import { offers, offerTabs, OHERO } from '../data'
import { promoArt } from '../art'
import { useApp } from '../store'

export default function OffersPage() {
  const app = useApp()
  const [filter, setFilter] = useState('All')
  const list = offers.filter(o => filter === 'All' || o.tag === filter)

  const claim = () => {
    if (!app.requireAuth()) return
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
                  <button className="btn sec small" onClick={() => app.openPromo(o.key)}>More info</button>
                  <button className="btn orange small" onClick={claim}>Claim now</button>
                </div>
                <div className="oterms">{o.terms}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
