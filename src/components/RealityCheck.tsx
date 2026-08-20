import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { fmt } from '../data'

// Periodic responsible-gambling prompt. Fires at the player's session-reminder
// interval while reality checks are on, showing time played and net position.
export default function RealityCheck() {
  const app = useApp()
  const [show, setShow] = useState(false)
  const start = useRef<{ at: number; bal: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const uid = app.user?.email ?? null
  const rc = app.user?.rc ?? false
  const mins = app.user?.limits.session ?? 60

  // Restart the session clock whenever a player signs in.
  useEffect(() => {
    if (!uid || !app.user) { start.current = null; setShow(false); return }
    start.current = { at: Date.now(), bal: app.user.balance }
  }, [uid])

  // Schedule the check at the configured interval.
  useEffect(() => {
    window.clearInterval(timer.current)
    if (!uid || !rc) return
    timer.current = window.setInterval(() => setShow(true), Math.max(1, mins) * 60000)
    return () => window.clearInterval(timer.current)
  }, [uid, rc, mins])

  if (!show || !app.user || !start.current) return null
  const elapsed = Math.max(1, Math.round((Date.now() - start.current.at) / 60000))
  const net = app.user.balance - start.current.bal
  const keepPlaying = () => { start.current = { at: Date.now(), bal: app.user!.balance }; setShow(false) }
  const takeBreak = () => { setShow(false); void app.logout() }

  return (
    <div className="overlay open" onClick={keepPlaying}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-head"><h3>Reality check</h3></div>
        <div className="modal-body">
          <p className="muted center" style={{ marginTop: 0 }}>You have been playing for about {elapsed} minute{elapsed === 1 ? '' : 's'}.</p>
          <div className="balcard"><div className="l">Net this session</div><div className="a" style={{ color: net >= 0 ? '#12B39A' : '#E23B3B' }}>{net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}</div></div>
          <button className="btn orange" onClick={keepPlaying}>Keep playing</button>
          <button className="btn sec" style={{ marginTop: 8 }} onClick={takeBreak}>Take a break</button>
          <p className="muted center" style={{ fontSize: 12, marginTop: 12 }}>Gambling should be fun, never a way to make money. You can set limits any time in your account.</p>
        </div>
      </div>
    </div>
  )
}
