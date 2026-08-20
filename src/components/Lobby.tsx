import { useState } from 'react'
import { useApp } from '../store'
import { allGames, sectionDefs, bens } from '../data'
import type { Game } from '../data'
import Promos from './Promos'
import Providers from './Providers'
import GameRow from './GameRow'
import GameCard from './GameCard'
import CategoryBar from './CategoryBar'
import Hero from './Hero'

export default function Lobby() {
  const app = useApp()
  const [q, setQ] = useState('')
  const lv = app.lobbyView
  const filtering = q.trim() !== '' || lv.mode !== 'all'

  let results: Game[] = []
  let title = ''
  if (q.trim() !== '') {
    const s = q.trim().toLowerCase()
    results = allGames.filter(g => g.name.toLowerCase().includes(s) || g.studio.toLowerCase().includes(s))
    title = `Results for “${q.trim()}” (${results.length})`
  } else if (lv.mode === 'favs') {
    results = app.user ? allGames.filter(g => app.user!.favs.includes(g.name)) : []
    title = `My Games (${results.length})`
  } else if (lv.mode === 'cat') {
    results = allGames.filter(g => g.cat === lv.cat)
    title = `${lv.cat} (${results.length * 40})`
  }

  const onCat = (name: string) => {
    if (name === 'Providers') { app.showToast('Providers are in the strip above'); return }
    setQ('')
    app.setLobbyView(lv.mode === 'cat' && lv.cat === name ? { mode: 'all', cat: '' } : { mode: 'cat', cat: name })
  }

  const recent: Game[] = app.user
    ? app.user.recent.map(n => allGames.find(g => g.name === n)).filter((g): g is Game => !!g)
    : []

  return (
    <>
      {!filtering && !app.user && <Hero />}
      {!filtering && recent.length > 0 && <div className="wrap"><GameRow title="Continue playing" games={recent} /></div>}
      {!filtering && <div className="wrap"><Promos /></div>}
      {!filtering && <div className="wrap"><GameRow title="Best Games — Ben’s Picks" games={bens} marquee dur={48} /></div>}
      {!filtering && <Providers />}

      <CategoryBar active={lv.mode === 'cat' ? lv.cat : ''} query={q} onCat={onCat} onQuery={setQ} />

      <div className="wrap">
        {filtering ? (
          <section>
            <div className="sec-head"><h2>{title}</h2></div>
            {results.length ? (
              <div className="results-grid">{results.map(g => <GameCard key={g.name} game={g} />)}</div>
            ) : (
              <p className="empty">{lv.mode === 'favs' ? 'No favourites yet. Tap the heart on any game to save it here.' : 'No games match. Try another search.'}</p>
            )}
          </section>
        ) : (
          sectionDefs.slice(1).map(sec => <GameRow key={sec.id} title={sec.title} games={sec.games} />)
        )}
      </div>
    </>
  )
}
