import { useState } from 'react'
import { offers, offerTabs, OHERO } from '../data'
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
    <div className="wrap offers-wrap">
      <div className="offers-hero">
        <span className="offers-eyebrow">MrBen Promotions</span>
        <h2>Bonuses built to be claimed</h2>
        <p>Welcome boosts, weekly free spins, sports free bets and VIP rewards — grab what’s yours.</p>
        <div className="offers-hero-note">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
          Amounts shown in <b>{app.ccy}</b> — change currency in the top bar.
        </div>
      </div>

      <div className="otabs">
        {offerTabs.map(t => <button key={t} className={'otab' + (t === filter ? ' on' : '')} onClick={() => setFilter(t)}>{t}</button>)}
      </div>

      <div className="offers-grid">
        {list.map((o) => {
          const g = OHERO[o.key] || ['#F5A524', '#B23000']
          return (
            <article className="jcard" key={o.key} style={{ ['--glow' as string]: g[0] }}>
              <span className="jcard-glow" />
              <div className="jcard-top">
                <span className="jribbon">{o.ribbon}</span>
                <span className="jtag">{o.tag}</span>
              </div>
              <div className="jtitle">{app.loc(o.title)}</div>
              <div className="jbig">{app.loc(o.hero)}</div>
              <div className="jbigsub">{app.loc(o.heroSub)}</div>
              <div className="jfacts">
                {o.facts.map((f, j) => (
                  <div className="jfact" key={j}>
                    <span className="jfact-v">{app.loc(f.value)}</span>
                    <span className="jfact-l">{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="jbtns">
                <button className="btn orange small" onClick={claim}>Claim now</button>
                <button className="jbtn-ghost" onClick={() => app.openPromo(o.key)}>Full terms</button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
