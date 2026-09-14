import { useState } from 'react'
import { offers, offerTabs, OHERO } from '../data'
import { useApp } from '../store'

export default function OffersPage() {
  const app = useApp()
  const [filter, setFilter] = useState('All')
  const list = offers.filter(o => filter === 'All' || o.tag === filter)
  // translate a key, then localise its money {tokens} in the current currency
  const tl = (key: string, fallback: string) => app.loc(app.t(key, fallback))

  const claim = () => {
    if (!app.requireAuth()) return
    app.openModal({ type: 'wallet' })
    app.showToast(app.t('promo.optedIn'))
  }

  return (
    <div className="wrap offers-wrap">
      <div className="offers-hero">
        <span className="offers-eyebrow">{app.t('promo.eyebrow')}</span>
        <h2>{app.t('promo.title')}</h2>
        <p>{app.t('promo.sub')}</p>
        <div className="offers-hero-note">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
          {app.t('promo.ccyNote', undefined, { ccy: app.ccy })}
        </div>
      </div>

      <div className="otabs">
        {offerTabs.map(t => <button key={t} className={'otab' + (t === filter ? ' on' : '')} onClick={() => setFilter(t)}>{app.t('tab.' + t, t)}</button>)}
      </div>

      <div className="offers-grid">
        {list.map((o) => {
          const g = OHERO[o.key] || ['#F5A524', '#B23000']
          return (
            <article className="jcard" key={o.key} style={{ ['--glow' as string]: g[0] }}>
              <span className="jcard-glow" />
              <div className="jcard-top">
                <span className="jribbon">{app.t('ribbon.' + o.ribbon, o.ribbon || '')}</span>
                <span className="jtag">{app.t('tab.' + o.tag, o.tag)}</span>
              </div>
              <div className="jtitle">{tl('offer.' + o.key + '.title', o.title)}</div>
              <div className="jbig">{app.loc(o.hero)}</div>
              <div className="jbigsub">{tl('offer.' + o.key + '.heroSub', o.heroSub)}</div>
              <div className="jfacts">
                {o.facts.map((f, j) => (
                  <div className="jfact" key={j}>
                    <span className="jfact-v">{app.loc(f.value)}</span>
                    <span className="jfact-l">{app.t('fact.' + f.label, f.label)}</span>
                  </div>
                ))}
              </div>
              <div className="jbtns">
                <button className="btn orange small" onClick={claim}>{app.t('cta.claim')}</button>
                <button className="jbtn-ghost" onClick={() => app.openPromo(o.key)}>{app.t('cta.fullTerms')}</button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
