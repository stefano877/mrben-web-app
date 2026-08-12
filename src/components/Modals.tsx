import { useEffect, useState } from 'react'
import { useApp } from '../store'
import type { Txn } from '../store'
import type { Game } from '../data'
import { fmt, CHEST } from '../data'
import { chestModalSVG } from '../art'
import { countries, byCode, flag, detectCountry } from '../countries'

let txnId = 1
const mkTxn = (kind: Txn['kind'], amount: number, label: string): Txn => ({ id: txnId++, kind, amount, label, at: Date.now() })

/* ---------------- Auth ---------------- */
function AuthModal() {
  const app = useApp()
  const mode = app.authModal
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [pass, setPass] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [marketing, setMarketing] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [err, setErr] = useState('')

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

  const submit = () => {
    if (mode === 'join') {
      const fullPhone = phone.trim() ? `+${dial} ${phone.trim()}` : ''
      const e = app.register(email, pass, { username: username.trim(), phone: fullPhone, country, dial, marketing })
      if (e) { setErr(e); return }
    } else {
      const e = app.login(email, pass)
      if (e) { setErr(e); return }
    }
    app.setAuthModal(null)
    app.showToast(mode === 'join' ? '🎉 Account created. Welcome to MrBen!' : '✓ Logged in')
  }

  return (
    <div className="overlay open" onClick={(ev) => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal">
        <div className="modal-head"><h3>{mode === 'join' ? 'Join MrBen' : 'Welcome back'}</h3><button className="x" onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          {mode === 'join' && <p className="muted center" style={{ marginTop: 0 }}>🎩 100% up to €200 on your first deposit</p>}
          <div className="field"><label>Email</label><input type="email" value={email} placeholder="you@email.com" onChange={e => setEmail(e.target.value)} /></div>
          {mode === 'join' && (
            <div className="field"><label>Username</label><input type="text" value={username} placeholder="choose a username" maxLength={16} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} /></div>
          )}
          <div className="field"><label>Password</label><input type="password" value={pass} placeholder="••••••••" onChange={e => setPass(e.target.value)} onKeyDown={e => mode === 'login' && e.key === 'Enter' && submit()} /></div>

          {mode === 'join' && <>
            <div className="field">
              <label>Country {detecting && <span className="hint">detecting…</span>}</label>
              <select className="csel" value={country} onChange={e => setCountry(e.target.value)}>
                <option value="" disabled>Select your country</option>
                {countries.map(c => <option key={c.code} value={c.code}>{flag(c.code)}  {c.name}  (+{c.dial})</option>)}
              </select>
            </div>
            <div className="field">
              <label>Phone number</label>
              <div className="phone">
                <span className="dial">{country ? `${flag(country)} +${dial}` : '+'}</span>
                <input type="tel" value={phone} placeholder="phone number" onChange={e => setPhone(e.target.value.replace(/[^\d ]/g, ''))} />
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} />
              <span>Yes, send me promotions, bonuses and free spins</span>
            </label>
          </>}

          {err && <p className="err">{err}</p>}
          <button className="btn orange" onClick={submit}>{mode === 'join' ? 'Create account' : 'Log in'}</button>
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
    { k: 'local', ic: '🌎', c: '#0FA36B', t: 'Local rails (D24)', s: 'LATAM · Africa · Asia' },
    { k: 'card', ic: '💳', c: '#2E6FDE', t: 'Card', s: 'Visa · Mastercard' },
  ],
  withdraw: [
    { k: 'crypto', ic: '₿', c: '#F7931A', t: 'Crypto payout', s: 'To your wallet address' },
    { k: 'local', ic: '🏦', c: '#0FA36B', t: 'Local bank (D24)', s: '1–2 business days' },
  ],
}
function WalletModal() {
  const app = useApp()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('50')
  const [method, setMethod] = useState('crypto')
  if (!app.user) return null
  const u = app.user
  const confirm = () => {
    const v = parseFloat(amount || '0')
    if (v <= 0) { app.showToast('Enter an amount'); return }
    if (mode === 'deposit') {
      app.mutate(user => {
        let bonus = user.bonus
        let firstDepositDone = user.firstDepositDone
        let bonusAdded = 0
        if (!firstDepositDone) { bonusAdded = Math.min(200, v); bonus += bonusAdded; firstDepositDone = true }
        const txns = [mkTxn('deposit', v, `Deposit (${method})`), ...(bonusAdded ? [mkTxn('bonus', bonusAdded, 'Welcome bonus 100%')] : []), ...user.txns].slice(0, 60)
        return { balance: user.balance + v, bonus, firstDepositDone, txns }
      })
      app.showToast(u.firstDepositDone ? `✓ Deposited ${fmt(v)}` : `✓ Deposited ${fmt(v)} + ${fmt(Math.min(200, v))} bonus`)
    } else {
      if (v > u.balance) { app.showToast('Amount exceeds balance'); return }
      app.mutate(user => ({ balance: user.balance - v, txns: [mkTxn('withdraw', v, `Withdrawal (${method})`), ...user.txns].slice(0, 60) }))
      app.showToast(`✓ Withdrawal ${fmt(v)} sent`)
    }
  }
  const methods = METHODS[mode]
  if (!methods.some(m => m.k === method)) setMethod(methods[0].k)
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Wallet</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="balcard"><div className="l">Available balance</div><div className="a">{fmt(u.balance)}</div><div className="b">🎁 Bonus wallet: {fmt(u.bonus)}</div></div>
          <div className="seg"><button className={mode === 'deposit' ? 'on' : ''} onClick={() => setMode('deposit')}>Deposit</button><button className={mode === 'withdraw' ? 'on' : ''} onClick={() => setMode('withdraw')}>Withdraw</button></div>
          <div className="amtin"><span>€</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div className="quick">{[20, 50, 100, 250].map(v => <button key={v} onClick={() => setAmount(String(v))}>€{v}</button>)}</div>
          <div>
            {methods.map(m => (
              <div key={m.k} className={'method' + (method === m.k ? ' sel' : '')} onClick={() => setMethod(m.k)}>
                <div className="mic" style={{ background: m.c }}>{m.ic}</div>
                <div><div className="mt">{m.t}</div><div className="ms">{m.s}</div></div>
              </div>
            ))}
          </div>
          <button className="btn orange" onClick={confirm}>{mode === 'deposit' ? 'Deposit ' : 'Withdraw '}{fmt(parseFloat(amount || '0'))}</button>
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
const SYMS = ['🍒', '🔔', '⭐', '💎', '7️⃣', '🍋', '👑', '🍀']
const BET_STEPS = [0.5, 1, 2, 5, 10, 20]
function GameModal({ game }: { game: Game }) {
  const app = useApp()
  const [bet, setBet] = useState(2)
  const [reels, setReels] = useState<string[]>([game.ic, '🔔', '⭐'])
  const [win, setWin] = useState('')
  const [lastBet, setLastBet] = useState(0)
  if (!app.user) return null
  const u = app.user
  const spin = () => {
    if (u.excluded) { app.showToast('🚫 Self-excluded. Play is blocked.'); return }
    if (u.balance < bet) { app.showToast('Insufficient funds. Top up your wallet.'); return }
    const r = [0, 1, 2].map(() => SYMS[Math.floor(Math.random() * SYMS.length)])
    setReels(r)
    const w = Math.random() < 0.42 ? +(bet * (Math.random() * 4 + 1.5)).toFixed(2) : 0
    setLastBet(bet)
    app.mutate(user => {
      const txns = [mkTxn('bet', bet, `Bet · ${game.name}`), ...(w > 0 ? [mkTxn('win', w, `Win · ${game.name}`)] : []), ...user.txns].slice(0, 60)
      return { balance: user.balance - bet + w, points: user.points + Math.round(bet), txns }
    })
    if (w > 0) { setWin('WIN ' + fmt(w) + '!'); setTimeout(() => setWin(''), 900) } else setWin('')
  }
  const rollback = () => {
    if (lastBet === 0) { app.showToast('Nothing to roll back'); return }
    app.mutate(user => ({ balance: user.balance + lastBet, txns: [mkTxn('bonus', lastBet, 'Rollback'), ...user.txns].slice(0, 60) }))
    setLastBet(0); app.showToast('↩ Last round rolled back')
  }
  const adj = (d: number) => { const i = BET_STEPS.indexOf(bet); setBet(BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, i + d))]) }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
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
          <button className="btn orange" onClick={spin}>Spin 🎰</button>
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={rollback}>↩ Rollback last round</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Account + RG ---------------- */
function AccountModal() {
  const app = useApp()
  if (!app.user) return null
  const u = app.user
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>Account</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="prof">
            <div className="avatar">🙂</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{u.username || u.email.split('@')[0]}</div>
              <div className="muted" style={{ fontSize: 13 }}>{u.email}</div>
              {(u.country || u.phone) && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{u.country ? `${flag(u.country)} ${byCode(u.country)?.name ?? u.country}` : ''}{u.phone ? ` · ${u.phone}` : ''}</div>}
              <div className="kyc" style={{ marginTop: 6 }}>✓ KYC verified{u.marketing ? ' · 📣 promos on' : ''}</div>
            </div>
          </div>
          <div className="balrow">
            <div><div className="brl">Balance</div><div className="brv">{fmt(u.balance)}</div></div>
            <div><div className="brl">Bonus</div><div className="brv">{fmt(u.bonus)}</div></div>
            <div><div className="brl">Points</div><div className="brv">{u.points.toLocaleString('en-US')}</div></div>
          </div>
          <div className="card2" style={{ padding: '4px 17px' }}>
            <div className="li" onClick={() => app.openModal({ type: 'wallet' })}><div className="lic">💳</div><div><div className="lt">Wallet &amp; transactions</div><div className="ls">Deposits, withdrawals, play</div></div><div className="chev">›</div></div>
          </div>
          <div className="rgbanner"><div style={{ fontSize: 22 }}>💚</div><div><div style={{ fontWeight: 900, fontSize: 15 }}>Responsible Gambling</div><div className="muted" style={{ fontSize: 12 }}>Limits are checked before every deposit and bet.</div></div></div>
          <div className="card2">
            <div className="h">Limits</div>
            <div className="lrow"><div><div className="lt">Deposit limit</div><div className="ls">Per day</div></div><span className="pill" onClick={() => app.showToast('Deposit limit editor')}>{fmt(u.limits.deposit)} ›</span></div>
            <div className="lrow"><div><div className="lt">Loss limit</div><div className="ls">Per week</div></div><span className="pill" onClick={() => app.showToast('Loss limit editor')}>{fmt(u.limits.loss)} ›</span></div>
            <div className="lrow"><div><div className="lt">Session limit</div><div className="ls">Reminder every</div></div><span className="pill" onClick={() => app.showToast('Session limit editor')}>{u.limits.session} min ›</span></div>
          </div>
          <div className="card2">
            <div className="lrow"><div><div className="lt">Reality checks</div><div className="ls">Pop-up with time and spend</div></div><div className={'toggle' + (u.rc ? ' on' : '')} onClick={() => { app.update({ rc: !u.rc }); app.showToast('Reality checks ' + (!u.rc ? 'on' : 'off')) }} /></div>
            <div className="lrow"><div><div className="lt">Cool-off</div><div className="ls">Pause 24h to 6 weeks</div></div><span className="pill" onClick={() => app.showToast('Cool-off, choose 24h to 6 weeks')}>Set ›</span></div>
            <div className="lrow"><div><div className="lt" style={{ color: '#E23B3B' }}>Self-exclusion</div><div className="ls">Block play 6 months+</div></div><span className="pill" onClick={() => { app.update({ excluded: !u.excluded }); app.showToast(!u.excluded ? '🚫 Self-exclusion active, play blocked' : 'Self-exclusion lifted') }}>{u.excluded ? 'Active' : 'Start'} ›</span></div>
          </div>
          <button className="btn sec" onClick={() => { app.logout(); app.closeModal(); app.showToast('Logged out') }}>Log out</button>
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
  const open = () => {
    if (claimed || opened) return
    setOpened(true)
    const prize = CHEST[Math.floor(Math.random() * CHEST.length)]
    app.mutate(user => ({ chestClaimed: true, bonus: prize[0] === '€' ? user.bonus + parseFloat(prize.slice(1)) : user.bonus }))
    setTimeout(() => { setReward(prize); app.showToast('🎉 Mystery Chest: ' + prize) }, 560)
  }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal">
        <div className="modal-head"><h3>🎁 Mystery Chest</h3><button className="x" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className={'chestwrap' + (opened || claimed ? ' chestopen' : ' shake')} dangerouslySetInnerHTML={{ __html: chestModalSVG() }} />
          <div className="wresult">{reward ? <>🎉 You found <b>{reward}</b>!</> : claimed ? 'Come back tomorrow for another chest.' : 'Tap to reveal your reward!'}</div>
          <button className="btn orange" disabled={claimed || opened} onClick={open}>{claimed || opened ? 'Claimed ✓' : 'Open chest'}</button>
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
    </>
  )
}
