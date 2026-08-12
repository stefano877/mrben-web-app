import { useMemo } from 'react'
import type { CSSProperties } from 'react'

function dots(n: number) {
  return Array.from({ length: n }, (): CSSProperties => ({
    left: `${Math.round(Math.random() * 100)}%`,
    width: `${(Math.random() * 3 + 2).toFixed(1)}px`,
    height: `${(Math.random() * 3 + 2).toFixed(1)}px`,
    animationDuration: `${(Math.random() * 8 + 9).toFixed(1)}s`,
    animationDelay: `${(-Math.random() * 14).toFixed(1)}s`,
  }))
}

export default function SideDots() {
  const left = useMemo(() => dots(16), [])
  const right = useMemo(() => dots(16), [])
  return (
    <>
      <div className="sidedots left">{left.map((s, i) => <i key={i} style={s} />)}</div>
      <div className="sidedots right">{right.map((s, i) => <i key={i} style={s} />)}</div>
    </>
  )
}
