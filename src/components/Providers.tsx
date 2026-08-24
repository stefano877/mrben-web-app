import { useState } from 'react'
import { providers } from '../data'
import { useApp } from '../store'

// Each studio maps to a file slug and a brand colour. The wall loads the real
// logo from /public/providers/<slug>.svg (then .png). Until the official file is
// added, it shows a brand-coloured wordmark, so nothing looks empty and each
// logo appears automatically the moment its file is dropped in.
const BRAND: Record<string, { slug: string; color: string }> = {
  'Pragmatic Play': { slug: 'pragmatic-play', color: '#E8362A' },
  'Evolution': { slug: 'evolution', color: '#1B1B1F' },
  'NetEnt': { slug: 'netent', color: '#F04E23' },
  'Play’n GO': { slug: 'playn-go', color: '#5B2A86' },
  'Hacksaw Gaming': { slug: 'hacksaw-gaming', color: '#F5821F' },
  'Nolimit City': { slug: 'nolimit-city', color: '#141416' },
  'BGaming': { slug: 'bgaming', color: '#EC2027' },
  'Push Gaming': { slug: 'push-gaming', color: '#0A64C2' },
  'Relax Gaming': { slug: 'relax-gaming', color: '#00A88E' },
  'Big Time Gaming': { slug: 'big-time-gaming', color: '#B8860B' },
}

function ProvLogo({ name }: { name: string }) {
  const b = BRAND[name] ?? { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), color: '#101A45' }
  const srcs = [`/providers/${b.slug}.svg`, `/providers/${b.slug}.png`]
  const [step, setStep] = useState(0)

  if (step >= srcs.length) {
    const [first, ...rest] = name.split(' ')
    return (
      <span className="prov-word" style={{ color: b.color }}>
        {first}{rest.length ? <span className="pw-rest"> {rest.join(' ')}</span> : null}
      </span>
    )
  }
  return <img className="prov-img" src={srcs[step]} alt={name} loading="lazy" onError={() => setStep(s => s + 1)} />
}

export default function Providers() {
  const app = useApp()
  const list = [...providers, ...providers] // duplicated for the seamless marquee
  return (
    <div className="dark-sec">
      <div className="wrap">
        <div className="sec-head">
          <h2>Providers</h2>
          <span className="seeall" onClick={() => app.showToast('All 40+ providers')}>See all</span>
        </div>
        <div className="marq">
          <div className="marq-track" style={{ animationDuration: '34s' }}>
            {list.map((p, i) => (
              <div className="prov" key={i} onClick={() => app.showToast(p + ' games')} title={p}>
                <ProvLogo name={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
