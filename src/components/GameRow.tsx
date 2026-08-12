import { useRef } from 'react'
import type { Game } from '../data'
import GameCard from './GameCard'

interface Props { title: string; games: Game[]; marquee?: boolean; dur?: number }

export default function GameRow({ title, games, marquee, dur = 44 }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const nudge = (d: number) => {
    const el = rowRef.current
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  return (
    <section>
      <div className="sec-head">
        <h2>{title}</h2>
        <span className="seeall">See all ({games.length * 40})</span>
        {!marquee && (
          <div className="arrows">
            <button onClick={() => nudge(-1)}>‹</button>
            <button className="dark" onClick={() => nudge(1)}>›</button>
          </div>
        )}
      </div>
      {marquee ? (
        <div className="marq">
          <div className="marq-track" style={{ animationDuration: `${dur}s` }}>
            {games.map(g => <GameCard key={g.name} game={g} />)}
            {games.map(g => <GameCard key={g.name + '-dup'} game={g} />)}
          </div>
        </div>
      ) : (
        <div className="scrollx" ref={rowRef}>
          {games.map(g => <GameCard key={g.name} game={g} />)}
        </div>
      )}
    </section>
  )
}
