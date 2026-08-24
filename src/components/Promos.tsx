import { useApp } from '../store'
import { track } from '../analytics'

// The two welcome-offer hero banners. Full video creatives (casino + sports)
// with the offer and CTA baked in, so the whole banner is the click target.
const BANNERS = [
  { key: 'casino', src: '/casino-offer.mp4', poster: '/casino-poster.jpg', label: 'Casino welcome offer, 300% up to 1500 bonus' },
  { key: 'sports', src: '/sports-offer.mp4', poster: '/sports-poster.jpg', label: 'Sportsbook welcome offer, bet 10 get 50 free bet' },
]

export default function Promos() {
  const app = useApp()
  const go = (key: string) => {
    track('banner_click', { banner: key })
    if (app.user) app.setPage('offers'); else app.setAuthModal('join')
  }
  return (
    <section id="promos" aria-label="Welcome offers">
      <div className="vbanners">
        {BANNERS.map(b => (
          <button key={b.key} type="button" className="vbanner" onClick={() => go(b.key)} aria-label={b.label}>
            <video src={b.src} poster={b.poster} autoPlay muted loop playsInline preload="metadata" />
          </button>
        ))}
      </div>
    </section>
  )
}
