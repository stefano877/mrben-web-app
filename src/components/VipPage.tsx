import { useEffect, useRef } from 'react'
import { vipTiers, vipPerks } from '../data'
import { chestSVG } from '../art'
import { useApp } from '../store'

export default function VipPage() {
  const app = useApp()
  const points = app.user?.points ?? 0
  const barRef = useRef<HTMLSpanElement>(null)

  let idx = 0
  for (let i = 0; i < vipTiers.length; i++) if (points >= vipTiers[i].pts) idx = i
  const cur = vipTiers[idx]
  const next = vipTiers[idx + 1]
  const prog = next ? Math.min(1, (points - cur.pts) / (next.pts - cur.pts)) : 1

  useEffect(() => {
    const id = requestAnimationFrame(() => { if (barRef.current) barRef.current.style.width = (prog * 100).toFixed(0) + '%' })
    return () => cancelAnimationFrame(id)
  }, [prog])

  return (
    <div className="wrap">
      <div className="vip-hero">
        <h2>Ben’s VIP Club</h2>
        <div className="vsub">Every spin and every hand earns points toward better rewards.</div>
        <div className="vip-tier">
          <div className="vip-badge" style={{ background: cur.c }}>{cur.n[0]}</div>
          <div><div className="vt">{cur.n} tier</div><div className="vp">{points.toLocaleString('en-US')} loyalty points</div></div>
        </div>
        <div className="vbar"><span ref={barRef} /></div>
        <div className="vnext">{next ? <>{(next.pts - points).toLocaleString('en-US')} points to <b>{next.n}</b></> : 'You’ve reached the top tier. Legend!'}</div>
      </div>

      <div className="vladder">
        {vipTiers.map((t, k) => (
          <div key={t.n} className={'vstep' + (k < idx ? ' done' : '') + (k === idx ? ' cur' : '')}>
            <div className="vs-ic">{t.n[0]}</div>
            <div className="vs-n">{t.n}</div>
            <div className="vs-p">{t.pts.toLocaleString('en-US')} pts</div>
            {k < idx ? <span className="vs-chk"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg></span> : null}
          </div>
        ))}
      </div>

      <div className="offers-head" style={{ marginBottom: 10 }}><h2 style={{ fontSize: 20 }}>Your perks</h2></div>
      <div className="perks">
        {vipPerks.map((p, i) => (
          <div className="perk" key={i}><div className="pk-ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg></div><div><div className="pk-t">{p[1]}</div><div className="pk-s">{p[2]}</div></div></div>
        ))}
      </div>

      <div className="chestcard" onClick={() => (app.requireAuth() && app.openModal({ type: 'chest' }))}>
        <div dangerouslySetInnerHTML={{ __html: chestSVG() }} />
        <div><div className="cc-t">Mystery Chest</div><div className="cc-s">A free surprise reward is waiting for you.</div></div>
        <button className="btn" onClick={(e) => { e.stopPropagation(); if (app.requireAuth()) app.openModal({ type: 'chest' }) }}>Open chest</button>
      </div>
    </div>
  )
}
