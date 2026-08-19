import { useApp } from '../store'

// Drop a muted looping mp4/webm URL here when the Ben hero video is ready.
// Until then the mascot image is the poster. The <video> uses the same poster,
// so slow connections and reduced-motion never see a broken/empty frame.
const HERO_VIDEO = ''

export default function Hero() {
  const app = useApp()
  const scrollToGames = () => window.scrollTo({ top: Math.round(window.innerHeight * 0.85), behavior: 'smooth' })

  return (
    <section className="hero" aria-label="Welcome to MrBen">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">🎩 Welcome to MrBen</span>
          <h1>Play like a <span>gentleman</span>.<br />Win like a legend.</h1>
          <p>100% up to €200 plus 50 free spins on your first deposit. Crypto-fast payouts, thousands of games, one dapper host.</p>
          <div className="hero-cta">
            <button className="btn orange" onClick={() => app.setAuthModal('join')}>Join now</button>
            <button className="btn ghost-light" onClick={scrollToGames}>Explore games</button>
          </div>
          <div className="hero-trust">18+ · Anjouan licensed · Please play responsibly</div>
        </div>
        <div className="hero-art">
          {HERO_VIDEO
            ? <video className="hero-video" src={HERO_VIDEO} poster="/mascot.png" autoPlay muted loop playsInline preload="metadata" />
            : <img className="hero-img" src="/mascot.png" alt="Ben, your host" width={260} height={260} loading="eager" />}
        </div>
      </div>
    </section>
  )
}
