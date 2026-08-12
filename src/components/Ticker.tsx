import { promos } from '../data'
import { useApp } from '../store'

const heroColor: Record<string, string> = { casino: '#7A2BD0', sports: '#2A6BE0', trophy: '#8A3FE0', flag: '#E0A21E' }

export default function Ticker() {
  const app = useApp()
  const claim = () => (app.user ? app.setPage('offers') : app.setAuthModal('join'))
  const items = promos.map((o, i) => (
    <span className="twitem" key={i} onClick={() => app.setPage('offers')}>
      <i style={{ background: heroColor[o.key] || '#F35100' }}>🎁</i>
      <b>{o.h}: {o.big}</b>
      <button className="tclaim" onClick={(e) => { e.stopPropagation(); claim() }}>Claim now</button>
    </span>
  ))
  return (
    <div className="ticker">
      <div className="tlabel">🎁 Offers</div>
      <div className="twin"><div className="tmarq">{items}{items}</div></div>
    </div>
  )
}
