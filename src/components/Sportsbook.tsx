import { sportsData } from '../data'
import { useApp } from '../store'

export default function Sportsbook() {
  const app = useApp()
  const bet = (team: string, odd: string) => {
    if (odd === '—') return
    if (!app.requireAuth()) return
    app.showToast(`Added to bet slip: ${team} @ ${odd}`)
  }
  const oddBtn = (lbl: string, team: string, odd: string) => (
    <button disabled={odd === '—'} onClick={() => bet(team, odd)}><span>{lbl}</span><b>{odd}</b></button>
  )
  return (
    <div className="wrap">
      <div className="offers-head"><h2>Sportsbook</h2><p>Live and upcoming matches. Build your bet.</p></div>
      <div className="sports-grid">
        {sportsData.map((m, i) => (
          <div className="match" key={i}>
            <div className="mtop">
              <span className="mleague">{m.league}</span>
              <span className={'mtime' + (m.live ? ' live' : '')}>{m.live ? '● LIVE' : m.time}</span>
            </div>
            <div className="mteams"><div>{m.a}</div><div className="vs">vs</div><div>{m.b}</div></div>
            <div className="modds">
              {oddBtn('1', m.a, m.o[0])}
              {oddBtn('X', 'Draw', m.o[1])}
              {oddBtn('2', m.b, m.o[2])}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
