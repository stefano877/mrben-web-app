import { providers } from '../data'
import { useApp } from '../store'

export default function Providers() {
  const app = useApp()
  const chips = providers.map((p, i) => {
    const parts = p.split('|')
    return (
      <div className="prov" key={i} onClick={() => app.showToast(p.replace(/\|/g, ' ') + ' games')}>
        {parts[0]}
        {parts[1] ? <small>{parts.slice(1).join(' ')}</small> : null}
      </div>
    )
  })
  return (
    <div className="dark-sec">
      <div className="wrap">
        <div className="sec-head">
          <h2>Providers</h2>
          <span className="seeall" onClick={() => app.showToast('All 40+ providers')}>See all</span>
        </div>
        <div className="marq"><div className="marq-track" style={{ animationDuration: '34s' }}>{chips}{chips}</div></div>
      </div>
    </div>
  )
}
