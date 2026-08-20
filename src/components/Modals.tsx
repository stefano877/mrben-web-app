import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store'
import type { LimitKind } from '../store'
import type { Game } from '../data'
import { fmt } from '../data'
import { chestModalSVG, wheelSVG } from '../art'
import { countries, byCode, flag, detectCountry } from '../countries'

const CONFETTI_COLORS = ['#F35100', '#FFCB57', '#2A6BE0', '#12B39A', '#E85D9A', '#7A2BD0', '#5EE6A8']
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 40 }, () => ({
    left: Math.random() * 100,
    bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: (Math.random() * 0.25).toFixed(2),
    dur: (0.9 + Math.random() * 0.7).toFixed(2),
    rot: Math.floor(Math.random() * 360),
  })), [])
  return (
    <div className="confetti">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.bg, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  )
}

/* ---------------- Auth ---------------- */
function AuthModal() {
  const app = useApp()
  const mode = app.authModal
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [dob, setDob] = useState('')
  const [pass, setPass] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [marketing, setMarketing] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Geo-locate the player and pre-pick their country + dial code when the Join form opens.
  useEffect(() => {
    if (mode !== 'join' || country) return
    let alive = true
    setDetecting(true)
    detectCountry().then(code => { if (alive) { setCountry(code); setDetecting(false) } })
    return () => { alive = false }
  }, [mode])

  if (!mode) return null
  const dial = byCode(country)?.dial ?? ''
  const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10) })()

  const submit = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    try {
      if (mode === 'join') {
        if (pass.length < 12) { setErr('Password must be at least 12 characters'); return }
        // Drop the national leading zero so the number is valid E.164 (e.g. 07700 -> +447700).
        const nat = phone.trim().replace(/\s+/g, '').replace(/^0+/, '')
        const fullPhone = nat ? `+${dial} ${nat}` : ''
        const e = await app.register(email, pass, { username: username.trim(), dob, phone: fullPhone, country, dial, marketing })
        if (e) { setErr(e); return }
      } else {
        const e = await app.login(email, pass)
        if (e) { setErr(e); return }
      }
      app.setAuthModal(null)
      app.showToast(mode === 'join' ? 'Account created. Welcome to MrBen!' : 'Logged in')
    } finally { setBusy(false) }
  }

  return (
    <div className="overlay open" onClick={(ev) => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal">
        <div className="modal-head"><h3>{mode === 'join' ? 'Join MrBen' : 'Welcome back'}</h3><button className="x" onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          {mode === 'join' && <p className="muted center" style={{ marginTop: 0 }}> 100% up to €200 on your first deposit</p>}
          <div className="field"><label>Email</label><input type="email" value={email} placeholder="you@email.com" onChange={e => setEmail(e.target.value)} /></div>
          {mode === 'join' && (
            <div className="field"><label>Username <span className="hint">3 to 20 characters</span></label><input type="text" value={username} placeholder="choose a username" maxLength={20} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} /></div>
          )}
          {mode === 'join' && (
            <div className="field"><label>Date of birth <span className="hint">you must be 18+</span></label><input type="date" value={dob} max={maxDob} onChange={e => setDob(e.target.value)} /></div>
          )}
          <div className="field"><label>Password {mode === 'join' && <span className="hint">at least 12 characters</span>}</label><input type="password" value={pass} placeholder="••••••••" onChange={e => setPass(e.target.value)} onKeyDown={e => mode === 'login' && e.key === 'Enter' && submit()} /></div>

          {mode === 'join' && <>
            <div className="field">
              <label>Country {detecting && <span className="hint">detecting…</span>}</label>
              <select className="csel" value={country} onChange={e => setCountry(e.target.value)}>
                <option value="" disabled>Select your country</option>
                {countries.map(c => <option key={c.code} value={c.code}>{flag(c.code)}  {c.name}  (+{c.dial})</option>)}
              </select>
            </div>
            <div className="field">
              <label>Phone number <span className="hint">no leading 0</span></label>
              <div className="phone">
                <span className="dial">{country ? `${flag(country)} +${dial}` : '+'}</span>
                <input type="tel" value={phone} placeholder="7700 900123" onChange={e => setPhone(e.target.value.replace(/[^\d ]/g, ''))} />
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} />
              <span>Yes, send me promotions, bonuses and free spins</span>
            </label>
          </>}

          {err && <p className="err">{err}</p>}
          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={submit}>{mode === 'join' ? 'Create account' : 'Log in'}</button>
          <div className="switchline">
            {mode === 'join'
              ? <>Already have an account? <a onClick={() => { setErr(''); app.setAuthModal('login') }}>Login</a></>
              : <>New here? <a onClick={() => { setErr(''); app.setAuthModal('join') }}>Join now</a></>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Wallet ---------------- */
const METHODS = {
  deposit: [
    { k: 'crypto', ic: '₿', c: '#F7931A', t: 'Crypto', s: 'BTC · ETH · USDT · instant' },
    { k: 'local', ic: '', c: '#0FA36B', t: 'Local rails (D24)', s: 'LATAM · Africa · Asia' },
    { k: 'card', ic: '', c: '#2E6FDE', t: 'Card', s: 'Visa · Mastercard' },
  ],
  withdraw: [
    { k: 'crypto', ic: '₿', c: '#F7931A', t: 'Crypto payout', s: 'To your wallet address' },
    { k: 'local', ic: '', c: '#0FA36B', t: 'Local bank (D24)', s: '1–2 business days' },
  ],
}
function MethodIcon({ k }: { k: string }) {
  if (k === 'crypto') return <span style={{ color: '#fff', fontWeight: 900 }}>₿</span>
  if (k === 'card') return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" /></svg>
}
function WalletModal() {
  const app = useApp()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('50')
  const [method, setMethod] = useState('crypto')
  const [busy, setBusy] = useState(false)
  if (!app.user) return null
  const u = app.user
  const confirm = async () => {
    if (busy) return
    const v = parseFloat(amount || '0')
    if (v <= 0) { app.showToast('Enter an amount'); return }
    setBusy(true)
    try {
      if (mode === 'deposit') {
        const r = await app.deposit(v, method)
        if (!r.ok) { app.showToast(r.error); return }
        app.showToast(r.bonusAdded > 0 ? `Deposited ${fmt(v)} + ${fmt(r.bonusAdded)} bonus` : `Deposited ${fmt(v)}`)
      } else {
        const r = await app.withdraw(v, method)
        if (!r.ok) { app.showToast(r.error); return }
        app.showToast(`Withdrawal ${fmt(v)} sent`)
      }
    } finally { setBusy(false) }
  }
  const methods = METHODS[mode]
  if (!methods.some(m => m.k === method)) setMethod(methods[0].k)
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Wallet</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="balcard"><div className="l">Available balance</div><div className="a">{fmt(u.balance)}</div><div className="b">Bonus wallet: {fmt(u.bonus)}</div></div>
          {u.walletReady === false ? (
            <div className="wallet-wait">
              <div className="ww-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></div>
              <div className="ww-t">Wallet almost ready</div>
              <div className="ww-s">We are finishing setting up your payment wallet. Deposits and withdrawals open as soon as it is provisioned. You can still explore the games in demo.</div>
            </div>
          ) : (<>
            <div className="seg"><button className={mode === 'deposit' ? 'on' : ''} onClick={() => setMode('deposit')}>Deposit</button><button className={mode === 'withdraw' ? 'on' : ''} onClick={() => setMode('withdraw')}>Withdraw</button></div>
            <div className="amtin"><span>€</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="quick">{[20, 50, 100, 250].map(v => <button key={v} onClick={() => setAmount(String(v))}>€{v}</button>)}</div>
            <div>
              {methods.map(m => (
                <div key={m.k} className={'method' + (method === m.k ? ' sel' : '')} onClick={() => setMethod(m.k)}>
                  <div className="mic" style={{ background: m.c }}><MethodIcon k={m.k} /></div>
                  <div><div className="mt">{m.t}</div><div className="ms">{m.s}</div></div>
                </div>
              ))}
            </div>
            <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={confirm}>{mode === 'deposit' ? 'Deposit ' : 'Withdraw '}{fmt(parseFloat(amount || '0'))}</button>
          </>)}
          {u.txns.length > 0 && (
            <div className="txns">
              <div className="txns-h">Recent transactions</div>
              {u.txns.slice(0, 6).map(t => (
                <div className="txn" key={t.id}><span className={'tk tk-' + t.kind}>{t.kind}</span><span className="tl">{t.label}</span><span className="ta">{fmt(t.amount)}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Game ---------------- */
const SYMS = ['A', 'K', 'Q', 'J', '10', '7']
const BET_STEPS = [0.5, 1, 2, 5, 10, 20]
function GameModal({ game }: { game: Game }) {
  const app = useApp()
  const [bet, setBet] = useState(2)
  const [reels, setReels] = useState<string[]>(['A', 'K', 'Q'])
  const [win, setWin] = useState('')
  const [burst, setBurst] = useState(0)
  const [lastBet, setLastBet] = useState(0)
  const [busy, setBusy] = useState(false)
  if (!app.user) return null
  const u = app.user
  const spin = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await app.placeBet(game, bet)
      if (!r.ok) { app.showToast(r.error); return }
      setReels([0, 1, 2].map(() => SYMS[Math.floor(Math.random() * SYMS.length)]))
      setLastBet(bet)
      if (r.win > 0) { setWin('WIN ' + fmt(r.win) + '!'); setBurst(b => b + 1); setTimeout(() => setWin(''), 900) } else setWin('')
    } finally { setBusy(false) }
  }
  const rollback = async () => {
    if (busy) return
    if (lastBet === 0) { app.showToast('Nothing to roll back'); return }
    setBusy(true)
    try {
      const r = await app.rollback(lastBet)
      if (!r.ok) { app.showToast(r.error); return }
      setLastBet(0); app.showToast('Last round rolled back')
    } finally { setBusy(false) }
  }
  const adj = (d: number) => { const i = BET_STEPS.indexOf(bet); setBet(BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, i + d))]) }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      {burst > 0 && <Confetti key={burst} />}
      <div className="modal">
        <div className="modal-head"><h3 style={{ fontSize: 16 }}>{game.name}</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="stage" style={{ background: `linear-gradient(140deg,${game.grad[0]},${game.grad[1]})` }}>
            <div className="sbal">Balance {fmt(u.balance)}</div>
            <div className="reel">{reels.map((s, i) => <span key={i}>{s}</span>)}</div>
            {win && <div className="winflash show">{win}</div>}
          </div>
          <div style={{ fontSize: 12, color: '#7A8290', marginBottom: 11 }}>{game.studio} · real money + demo</div>
          <div className="betbar"><span className="muted" style={{ fontWeight: 800 }}>Bet per spin</span><span className="pill">{fmt(bet)}</span></div>
          <div className="row2" style={{ marginBottom: 10 }}><button className="btn sec" onClick={() => adj(-1)}>– Bet</button><button className="btn sec" onClick={() => adj(1)}>+ Bet</button></div>
          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={spin}>Spin</button>
          <button className="btn ghost" style={{ marginTop: 8 }} disabled={busy} onClick={rollback}>Rollback last round</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Account + RG ---------------- */
const LIMIT_ROWS: { k: LimitKind; label: string; sub: string; money: boolean }[] = [
  { k: 'deposit', label: 'Deposit limit', sub: 'Per day', money: true },
  { k: 'loss', label: 'Loss limit', sub: 'Per week', money: true },
  { k: 'session', label: 'Session reminder', sub: 'Every', money: false },
]
const hrsLeft = (at: number) => Math.max(1, Math.ceil((at - Date.now()) / 3600000))

function AccountModal() {
  const app = useApp()
  const [editKind, setEditKind] = useState<LimitKind | null>(null)
  const [editVal, setEditVal] = useState('')
  const [exclOpen, setExclOpen] = useState(false)
  const [exclPeriod, setExclPeriod] = useState('6 months')
  const [exclType, setExclType] = useState('')
  const [busy, setBusy] = useState(false)
  if (!app.user) return null
  const u = app.user

  const showVal = (k: LimitKind) => (LIMIT_ROWS.find(r => r.k === k)!.money ? fmt(u.limits[k]) : `${u.limits[k]} min`)
  const startEdit = (k: LimitKind) => { setEditKind(k); setEditVal(String(u.limits[k])) }
  const saveEdit = async () => {
    if (busy || !editKind) return
    const v = parseFloat(editVal)
    if (!v || v <= 0) { app.showToast('Enter a valid amount'); return }
    setBusy(true)
    try {
      const r = await app.setLimit(editKind, v)
      if (!r.ok) { app.showToast(r.error); return }
      app.showToast(r.outcome === 'lowered' ? 'Limit lowered, effective now' : 'Increase requested, effective in 24 hours')
      setEditKind(null)
    } finally { setBusy(false) }
  }
  const confirmExcl = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await app.selfExclude(exclPeriod)
      if (!r.ok) { app.showToast(r.error); return }
      app.showToast(`Self-exclusion active for ${exclPeriod}`)
      setExclOpen(false); setExclType('')
    } finally { setBusy(false) }
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Account</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="prof">
            <div className="avatar">{(u.username || u.email)[0].toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{u.username || u.email.split('@')[0]}</div>
              <div className="muted" style={{ fontSize: 13 }}>{u.email}</div>
              {(u.country || u.phone) && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{u.country ? `${flag(u.country)} ${byCode(u.country)?.name ?? u.country}` : ''}{u.phone ? ` · ${u.phone}` : ''}</div>}
              <div className="kyc" style={{ marginTop: 6 }}>KYC verified{u.marketing ? ' · promos on' : ''}</div>
            </div>
          </div>
          <div className="balrow">
            <div><div className="brl">Balance</div><div className="brv">{fmt(u.balance)}</div></div>
            <div><div className="brl">Bonus</div><div className="brv">{fmt(u.bonus)}</div></div>
            <div><div className="brl">Points</div><div className="brv">{u.points.toLocaleString('en-US')}</div></div>
          </div>
          <div className="card2" style={{ padding: '4px 17px' }}>
            <div className="li" onClick={() => app.openModal({ type: 'wallet' })}><div className="lic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></div><div><div className="lt">Wallet &amp; transactions</div><div className="ls">Deposits, withdrawals, play</div></div><div className="chev">›</div></div>
          </div>
          <div className="rgbanner"><div><div style={{ fontWeight: 900, fontSize: 15 }}>Responsible Gambling</div><div className="muted" style={{ fontSize: 12 }}>Decreases apply now. Increases wait 24 hours and can be cancelled.</div></div></div>

          <div className="card2">
            <div className="h">Limits</div>
            {LIMIT_ROWS.map(r => (
              <div className="lrow" key={r.k} style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div className="lt">{r.label}</div><div className="ls">{r.sub}</div></div>
                  <span className="pill" onClick={() => (editKind === r.k ? setEditKind(null) : startEdit(r.k))}>{showVal(r.k)} ›</span>
                </div>
                {editKind === r.k && (
                  <div className="lim-edit">
                    <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} />
                    <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={saveEdit}>Save</button>
                    <button className="btn sec" onClick={() => setEditKind(null)}>Cancel</button>
                  </div>
                )}
                {u.pending[r.k] && (
                  <div className="pending-row">
                    ⏳ Increase to {r.money ? fmt(u.pending[r.k]!.value) : `${u.pending[r.k]!.value} min`} pending, effective in {hrsLeft(u.pending[r.k]!.at)}h
                    <span className="cancel" onClick={() => { void app.cancelPending(r.k); app.showToast('Pending increase cancelled') }}>Cancel</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card2">
            <div className="lrow"><div><div className="lt">Reality checks</div><div className="ls">Pop-up with time and spend</div></div><div className={'toggle' + (u.rc ? ' on' : '')} onClick={() => { void app.setRealityChecks(!u.rc); app.showToast('Reality checks ' + (!u.rc ? 'on' : 'off')) }} /></div>
            <div className="lrow" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div className="lt" style={{ color: '#E23B3B' }}>Self-exclusion</div><div className="ls">Blocks all play for the chosen period</div></div>
                {u.excluded
                  ? <span className="pill" style={{ background: '#FDE7E7', color: '#E23B3B' }}>Active</span>
                  : <span className="pill" onClick={() => setExclOpen(o => !o)}>Start ›</span>}
              </div>
              {u.excluded && <div style={{ marginTop: 8 }}><span className="demoreset" onClick={() => { void app.liftExclusion(); app.showToast('Self-exclusion lifted (demo)') }}>Lift (demo only)</span></div>}
              {!u.excluded && exclOpen && (
                <div className="excl">
                  <select value={exclPeriod} onChange={e => setExclPeriod(e.target.value)}>
                    {['24 hours', '1 week', '1 month', '6 months', 'Permanent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <p>This blocks all play and login for {exclPeriod}. It cannot be undone early. To confirm, type CONFIRM below.</p>
                  <input type="text" value={exclType} placeholder="Type CONFIRM" onChange={e => setExclType(e.target.value)} />
                  <button className={'btn' + (busy ? ' busy' : '')} disabled={busy || exclType.trim().toUpperCase() !== 'CONFIRM'} onClick={confirmExcl}>Confirm self-exclusion</button>
                </div>
              )}
            </div>
          </div>

          <button className="btn sec" onClick={() => { void app.logout(); app.closeModal(); app.showToast('Logged out') }}>Log out</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Mystery chest ---------------- */
function ChestModal() {
  const app = useApp()
  const [opened, setOpened] = useState(false)
  const [reward, setReward] = useState('')
  if (!app.user) return null
  const claimed = app.user.chestClaimed
  const open = async () => {
    if (claimed || opened) return
    setOpened(true)
    const r = await app.openChest()
    if (!r.ok) { setOpened(false); app.showToast(r.error); return }
    setTimeout(() => { setReward(r.prize); app.showToast('Mystery Chest: ' + r.prize) }, 560)
  }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Mystery Chest</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className={'chestwrap' + (opened || claimed ? ' chestopen' : ' shake')} dangerouslySetInnerHTML={{ __html: chestModalSVG() }} />
          <div className="wresult">{reward ? <>You found <b>{reward}</b>!</> : claimed ? 'Come back tomorrow for another chest.' : 'Tap to reveal your reward!'}</div>
          <button className="btn orange" disabled={claimed || opened} onClick={open}>{claimed || opened ? 'Claimed' : 'Open chest'}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Daily bonus wheel ---------------- */
function WheelModal() {
  const app = useApp()
  const [spun, setSpun] = useState(false)
  const [result, setResult] = useState('')
  if (!app.user) return null
  const claimed = app.user.wheelClaimed
  const spin = async () => {
    if (claimed || spun) return
    setSpun(true)
    const r = await app.spinWheel()
    if (!r.ok) { setSpun(false); app.showToast(r.error); return }
    const seg = 45, target = 360 * 6 - (r.index * seg + seg / 2)
    const el = document.getElementById('wheelSpin')
    if (el) { el.style.transition = 'transform 4.2s cubic-bezier(.15,.7,.15,1)'; el.style.transform = `rotate(${target}deg)` }
    window.setTimeout(() => {
      setResult(r.prize === 'Try again' ? 'Better luck tomorrow!' : `You won ${r.prize}`)
      app.showToast(r.prize === 'Try again' ? 'So close! Try again tomorrow.' : 'Daily wheel: ' + r.prize)
    }, 4300)
  }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Daily Bonus Wheel</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <p className="muted center" style={{ marginTop: 0 }}>Spin once a day for a free bonus. Good luck!</p>
          <div className="wheelwrap"><div className="pointer" /><div dangerouslySetInnerHTML={{ __html: wheelSVG() }} /></div>
          <div className="wresult">{result || (claimed ? 'Come back tomorrow for another spin.' : '')}</div>
          <button className="btn orange" disabled={claimed || spun} onClick={spin}>{claimed ? 'Come back tomorrow' : spun ? 'Spinning…' : 'SPIN'}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Info / legal pages ---------------- */
const INFO_DOCS: Record<string, { title: string; html: string }> = {
  about: {
    title: 'About Us',
    html: `<p>MrBen is a bonus-heavy, mobile-first online casino from <b>Mr iGaming Group</b>, built around Ben, your host. Our mission is simple: thousands of great games, crypto-fast payouts, and a brand that actually looks after its players.</p>
    <p>We offer slots, live casino, table games and a sportsbook from leading studios, wrapped in a generous welcome package and a loyalty programme that rewards every spin.</p>
    <p>MrBen operates under an Anjouan Gaming Licence and serves players worldwide, excluding restricted territories. Full company details will appear here once incorporation is complete.</p>`,
  },
  terms: {
    title: 'Terms of Use',
    html: `<p>By creating an account and using MrBen you agree to these terms. You must be at least 18 years old and legally allowed to gamble in your country.</p>
    <p>Your account is personal and non-transferable. You are responsible for keeping your login secure and for all activity on your account.</p>
    <p>We may update these terms and will notify you of material changes. Bonuses and promotions carry their own terms. Full terms are finalised alongside our licence; this is a plain-language summary.</p>`,
  },
  privacy: {
    title: 'Privacy Policy',
    html: `<p>We collect the information you provide at sign-up (email, username, date of birth, country and phone) and your gameplay and transaction data. We use it to run your account, verify your age and identity, prevent fraud, and meet our legal and licensing obligations.</p>
    <p>We do not sell your personal data. You can request access to, correction of, or deletion of your data at any time via Support.</p>
    <p>The data controller and retention periods are confirmed with our licence. Your data is stored securely and transmitted over encrypted connections.</p>`,
  },
  support: {
    title: 'Support',
    html: `<p>Need a hand? Our team is here around the clock.</p>
    <p><b>support@mrben.com</b><br>Live chat (coming soon)</p>
    <p>We can help with your account, deposits and withdrawals, bonuses, games and responsible gambling. For account security we may ask you to verify your identity.</p>`,
  },
  contact: {
    title: 'Contact Us',
    html: `<p>Get in touch any time.</p>
    <p><b>support@mrben.com</b><br>Mr iGaming Group (registered office to be confirmed)</p>
    <p>For complaints, please see our Complaints &amp; procedures page first.</p>`,
  },
  'betting-rules': {
    title: 'Betting Rules',
    html: `<p>Sports bets are settled on the official result of the event. If a market is voided or an event is abandoned, affected bets are refunded.</p>
    <p>Maximum payout limits apply per bet and per day. Palpable errors in odds may be corrected. Full rules for each sport are published with the sportsbook.</p>`,
  },
  complaints: {
    title: 'Complaints & procedures',
    html: `<p>We aim to resolve every issue quickly and fairly. Please contact Support first with your account details and a description of the problem.</p>
    <p>If your complaint is not resolved within 8 weeks, you may escalate it to our independent dispute-resolution provider, named alongside our Anjouan licence.</p>`,
  },
  'promo-terms': {
    title: 'Promotional Terms & Conditions',
    html: `<p>Bonuses are subject to wagering requirements, a maximum bet while wagering, game-weighting rules and an expiry period. The specific terms are shown on each offer before you opt in.</p>
    <p>Slots contribute 100% to wagering; live casino and table games contribute 10%. Bonus abuse, including collusion and irregular play, voids the bonus and any winnings from it.</p>`,
  },
  cookies: {
    title: 'Cookie Settings',
    html: `<p>We use <b>essential</b> cookies to run the site and keep you logged in. With your consent we also use <b>analytics</b> cookies to improve MrBen and <b>marketing</b> cookies to show relevant offers.</p>
    <p>You can change your choice at any time from this panel.</p>`,
  },
  'rg-policy': {
    title: 'Responsible Gambling',
    html: `<p>Gambling should always be fun, never a way to make money or escape problems. MrBen gives you the tools to stay in control.</p>
    <p>From your account you can set <b>deposit, loss and session limits</b>, take a <b>cool-off</b>, or <b>self-exclude</b> at any time. A decrease to a limit applies immediately.</p>
    <p>If you need support: BeGambleAware, GamCare and Gordon Moody offer free, confidential help. You must be 18+ to play.</p>`,
  },
}

function InfoModal({ infoKey }: { infoKey: string }) {
  const app = useApp()
  const doc = INFO_DOCS[infoKey] ?? { title: 'MrBen', html: '<p>Coming soon.</p>' }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>{doc.title}</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="doc" dangerouslySetInnerHTML={{ __html: doc.html }} />
          {infoKey === 'rg-policy' && (
            <button className="btn orange" onClick={() => { app.closeModal(); if (app.user) app.openModal({ type: 'account' }); else app.setAuthModal('login') }}>Manage my limits</button>
          )}
          {infoKey === 'cookies' ? (
            <div className="row2">
              <button className="btn sec" onClick={() => { app.closeModal(); app.showToast('Essential cookies only') }}>Essential only</button>
              <button className="btn orange" onClick={() => { app.closeModal(); app.showToast('All cookies accepted') }}>Accept all</button>
            </div>
          ) : infoKey !== 'rg-policy' && (
            <button className="btn sec" onClick={app.closeModal}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Modals() {
  const app = useApp()
  return (
    <>
      <AuthModal />
      {app.modal?.type === 'wallet' && <WalletModal />}
      {app.modal?.type === 'game' && <GameModal game={app.modal.game} />}
      {app.modal?.type === 'account' && <AccountModal />}
      {app.modal?.type === 'chest' && <ChestModal />}
      {app.modal?.type === 'wheel' && <WheelModal />}
      {app.modal?.type === 'info' && <InfoModal infoKey={app.modal.key} />}
    </>
  )
}
