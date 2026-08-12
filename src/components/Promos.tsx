import { useRef } from 'react'
import { promos } from '../data'
import { promoArt } from '../art'
import { useApp } from '../store'

export default function Promos() {
  const app = useApp()
  const rowRef = useRef<HTMLDivElement>(null)
  const nudge = (d: number) => {
    const el = rowRef.current
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  const go = () => app.setPage('offers')
  return (
    <section id="promos">
      <div className="sec-head">
        <h2>Promotions</h2>
        <div className="arrows">
          <button onClick={() => nudge(-1)}>‹</button>
          <button className="dark" onClick={() => nudge(1)}>›</button>
        </div>
      </div>
      <div className="scrollx" ref={rowRef}>
        {promos.map((p, i) => (
          <div key={i} className="promo" style={{ backgroundImage: `linear-gradient(120deg,${p.g[0]},${p.g[1]})` }} onClick={go}>
            <span className="sheen" />
            <span className="tag">{p.tag}</span>
            <div className="p-copy">
              <h3>{p.h}</h3>
              <div className="big">{p.big}</div>
              <p>{p.p}</p>
              <span className="cta" onClick={(e) => { e.stopPropagation(); go() }}>{p.cta} →</span>
            </div>
            <div className="p-art" dangerouslySetInnerHTML={{ __html: promoArt(p.key) }} />
          </div>
        ))}
      </div>
    </section>
  )
}
