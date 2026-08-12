import { useEffect, useMemo, useState } from 'react'
import type { Game } from '../data'
import { eur } from '../data'
import { genCover } from '../art'
import { useApp } from '../store'

function JackpotRibbon({ base }: { base: number }) {
  const [v, setV] = useState(base)
  useEffect(() => {
    const id = setInterval(() => setV(x => x + Math.floor(Math.random() * 40) + 1), 2500)
    return () => clearInterval(id)
  }, [])
  return <div className="jrib">{eur(v)}</div>
}

export default function GameCard({ game }: { game: Game }) {
  const app = useApp()
  const cover = useMemo(() => (game.img ? '' : genCover(game)), [game.name])
  const fav = !!app.user?.favs.includes(game.name)
  const launch = () => {
    if (!app.requireAuth()) return
    app.pushRecent(game.name)
    app.openModal({ type: 'game', game })
  }
  return (
    <div className="gcard">
      <div className="tile" onClick={launch}>
        {game.img
          ? <img className="cover" src={game.img} alt={game.name} />
          : <div className="cover-host" dangerouslySetInnerHTML={{ __html: cover }} />}
        <button className={'fav' + (fav ? ' on' : '')} onClick={(e) => { e.stopPropagation(); app.toggleFav(game.name) }} aria-label="Favourite">
          <svg viewBox="0 0 24 24"><path d="M12 21C6 16.5 3 13 3 8.8 3 6 5.2 4 7.6 4 9.3 4 10.8 5 12 6.5 13.2 5 14.7 4 16.4 4 18.8 4 21 6 21 8.8 21 13 18 16.5 12 21Z" /></svg>
        </button>
        {game.jackBase ? <JackpotRibbon base={game.jackBase} /> : null}
        {game.pick
          ? <span className="badge" style={{ background: 'linear-gradient(180deg,#FF7A1A,#F35100)' }}>★ BEN</span>
          : game.badge ? <span className="badge" style={{ background: game.badgeC }}>{game.badge}</span> : null}
        <div className="play"><span>▶ Play</span></div>
      </div>
    </div>
  )
}
