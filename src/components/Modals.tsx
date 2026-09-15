import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store'
import type { LimitKind } from '../store'
import type { Game } from '../data'
import { fmt } from '../data'
import { chestModalSVG, wheelSVG } from '../art'
import { countries, byCode, flag, detectCountry } from '../countries'
import { LEGAL, POLICY_VERSION } from '../data/legal'
import { track } from '../analytics'
import Cashier from './Cashier'
import type { LaunchBlock } from '../api/launch'
import type { SessionSummary, TotpStatusResponse, TotpEnrolmentResponse } from '../api'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

// Makes a non-<button> element operable by keyboard: focusable, and activated by
// Enter or Space just like a real button (WCAG 2.1.1 Keyboard, MRB-98).
function clickable(handler: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e: ReactKeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler() } },
  }
}

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
  const [over18, setOver18] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'form' | 'totp'>('form')
  const [totpCode, setTotpCode] = useState('')

  // Geo-locate the player and pre-pick their country + dial code when the Join form opens.
  useEffect(() => {
    if (mode !== 'join' || country) return
    let alive = true
    setDetecting(true)
    detectCountry().then(code => { if (alive) { setCountry(code); setDetecting(false) } })
    return () => { alive = false }
  }, [mode])

  useEffect(() => { if (mode === 'join') track('signup_started'); else if (mode === 'login') track('login_started') }, [mode])
  useEffect(() => { setStep('form'); setTotpCode('') }, [mode])

  const loginErrMsg = (r: { code: string; correlationId?: string }) => {
    switch (r.code) {
      case 'ACCOUNT_BLOCKED': return app.t('auth.err.blocked', "This account isn't available right now. Please contact support.")
      case 'RATE_LIMITED': return app.t('auth.err.rate', 'Too many attempts. Please wait a moment and try again.')
      case 'INTERNAL_ERROR': return app.t('auth.err.server', 'Something went wrong. Please try again.') + (r.correlationId ? ` (ref ${r.correlationId})` : '')
      default: return app.t('auth.err.badLogin', 'Email or password is incorrect.')
    }
  }
  const regErrMsg = (r: { code: string; message: string; fields?: { path: string; message: string }[] }) => {
    switch (r.code) {
      case 'EMAIL_ALREADY_REGISTERED': return app.t('auth.err.emailTaken', 'That email is already registered. Try logging in instead.')
      case 'USERNAME_TAKEN': return app.t('auth.err.userTaken', 'That username is taken. Please choose another.')
      case 'WEAK_PASSWORD': return app.t('auth.err.weakPass', 'Please choose a stronger password (at least 12 characters).')
      case 'UNDERAGE': return app.t('auth.err.underageSrv', 'You must be at least 18 to open an account.')
      case 'COUNTRY_BLOCKED': return app.t('auth.err.country', 'Sorry — registration is not available in your country.')
      case 'RATE_LIMITED': return app.t('auth.err.rate', 'Too many attempts. Please wait a moment and try again.')
      case 'VALIDATION_FAILED': return r.fields && r.fields.length ? r.fields.map(f => f.message).join('. ') : (r.message || app.t('auth.err.check', 'Please check the form and try again.'))
      default: return r.message || app.t('auth.err.generic', 'Something went wrong. Please try again.')
    }
  }
  const submitTotp = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    try {
      const r = await app.verifyTotp(totpCode.trim())
      if (r.kind === 'ok') { app.setAuthModal(null); app.showToast(app.t('auth.toast.loggedIn', 'Logged in')); return }
      if (r.kind === 'error') {
        if (r.code === 'TOTP_CHALLENGE_EXPIRED') { setStep('form'); setErr(app.t('auth.err.totpExpired', 'That took too long — please sign in again.')); return }
        if (r.code === 'RATE_LIMITED') { setErr(app.t('auth.err.rate', 'Too many attempts. Please wait a moment and try again.')); return }
        setErr(app.t('auth.err.totpBad', "That code isn't right. Please try again."))
      }
    } finally { setBusy(false) }
  }


  if (!mode) return null
  if (mode === 'forgot') return <ForgotModal />
  if (mode === 'reset') return <ResetModal />
  if (step === 'totp') return (
    <div className="overlay open" onClick={(ev) => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('auth.totp.title', 'Two-step verification')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          <p className="muted" style={{ marginTop: 0 }}>{app.t('auth.totp.sub', 'Enter the 6-digit code from your authenticator app.')}</p>
          <div className="field"><label>{app.t('account.6digit', '6-digit code')}</label><input type="text" inputMode="numeric" autoFocus value={totpCode} placeholder="123 456" onChange={e => setTotpCode(e.target.value.replace(/[^0-9 ]/g, ''))} onKeyDown={e => e.key === 'Enter' && submitTotp()} /></div>
          {err && <p className="err">{err}</p>}
          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy || totpCode.trim().length < 6} onClick={submitTotp}>{app.t('auth.totp.verify', 'Verify')}</button>
          <div className="switchline"><a onClick={() => { setStep('form'); setErr('') }}>{app.t('auth.totp.back', 'Back to sign in')}</a></div>
        </div>
      </div>
    </div>
  )
  const dial = byCode(country)?.dial ?? ''
  const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10) })()
  const fieldDone = (_f: string) => { /* field-level funnel is outside the closed analytics taxonomy (MRB-100) */ }

  const submit = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    try {
      if (mode === 'join') {
        if (pass.length < 12) { setErr(app.t('auth.err.pass12', 'Password must be at least 12 characters')); return }
        // Age and policy acceptance are mandatory and must be explicit (MRB-95).
        if (!over18) { setErr(app.t('auth.err.age', 'Please confirm you are at least 18 years old.')); return }
        if (!acceptTerms) { setErr(app.t('auth.err.terms', 'Please accept the Terms and Privacy Policy to continue.')); return }
        // Drop the national leading zero so the number is valid E.164 (e.g. 07700 -> +447700).
        const nat = phone.trim().replace(/\s+/g, '').replace(/^0+/, '')
        const fullPhone = nat ? `+${dial} ${nat}` : ''
        track('signup_submitted')
        const r = await app.register(email, pass, {
          username: username.trim(), dob, phone: fullPhone, country, dial, marketing,
          ageConfirmed: true, termsAcceptedAt: new Date().toISOString(), policyVersion: POLICY_VERSION,
        })
        if (r.kind === 'error') { setErr(regErrMsg(r)); return }
      } else {
        const r = await app.login(email, pass)
        if (r.kind === 'totp') { setStep('totp'); setTotpCode(''); return }
        if (r.kind === 'error') { setErr(loginErrMsg(r)); return }
      }
      app.setAuthModal(null)
      app.showToast(mode === 'join' ? app.t('auth.toast.created', 'Account created. Welcome to MrBen!') : app.t('auth.toast.loggedIn', 'Logged in'))
    } finally { setBusy(false) }
  }

  return (
    <div className="overlay open" onClick={(ev) => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{mode === 'join' ? app.t('auth.join.title', 'Join MrBen') : app.t('auth.login.title', 'Welcome back')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          {mode === 'join' && <p className="muted center" style={{ marginTop: 0 }}>{app.t('auth.join.sub', '100% up to €200 on your first deposit')}</p>}
          <div className="field"><label>{app.t('auth.email', 'Email')}</label><input type="email" value={email} placeholder={app.t('auth.emailPh', 'you@email.com')} onChange={e => setEmail(e.target.value)} onBlur={() => mode === 'join' && email.trim() && fieldDone('email')} /></div>
          {mode === 'join' && (
            <div className="field"><label>{app.t('auth.username', 'Username')} <span className="hint">{app.t('auth.usernameHint', '3 to 20 characters')}</span></label><input type="text" value={username} placeholder={app.t('auth.usernamePh', 'choose a username')} maxLength={20} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} onBlur={() => username.trim() && fieldDone('username')} /></div>
          )}
          {mode === 'join' && (
            <div className="field"><label>{app.t('auth.dob', 'Date of birth')} <span className="hint">{app.t('auth.dobHint', 'you must be 18+')}</span></label><input type="date" value={dob} max={maxDob} onChange={e => setDob(e.target.value)} onBlur={() => dob && fieldDone('dob')} /></div>
          )}
          <div className="field"><label>{app.t('auth.password', 'Password')} {mode === 'join' && <span className="hint">{app.t('auth.pass12hint', 'at least 12 characters')}</span>}</label><input type="password" value={pass} placeholder="••••••••" onChange={e => setPass(e.target.value)} onBlur={() => mode === 'join' && pass && fieldDone('password')} onKeyDown={e => mode === 'login' && e.key === 'Enter' && submit()} /></div>

          {mode === 'join' && <>
            <div className="field">
              <label>{app.t('auth.country', 'Country')} {detecting && <span className="hint">{app.t('auth.detecting', 'detecting…')}</span>}</label>
              <select className="csel" value={country} onChange={e => { setCountry(e.target.value); if (e.target.value) fieldDone('country') }}>
                <option value="" disabled>{app.t('auth.selectCountry', 'Select your country')}</option>
                {countries.map(c => <option key={c.code} value={c.code}>{flag(c.code)}  {c.name}  (+{c.dial})</option>)}
              </select>
            </div>
            <div className="field">
              <label>{app.t('auth.phone', 'Phone number')} <span className="hint">{app.t('auth.phoneHint', 'no leading 0')}</span></label>
              <div className="phone">
                <span className="dial">{country ? `${flag(country)} +${dial}` : '+'}</span>
                <input type="tel" value={phone} placeholder="7700 900123" onChange={e => setPhone(e.target.value.replace(/[^\d ]/g, ''))} onBlur={() => phone.trim() && fieldDone('phone')} />
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={over18} onChange={e => setOver18(e.target.checked)} />
              <span>{app.t('auth.check18', 'I confirm I am at least 18 years old')}</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
              <span>{app.t('auth.acceptPre', 'I accept the ')}<a href="?legal=terms" target="_blank" rel="noopener">{app.t('auth.termsLink', 'Terms and Conditions')}</a>{app.t('auth.acceptMid', ' and ')}<a href="?legal=privacy" target="_blank" rel="noopener">{app.t('auth.privacyLink', 'Privacy Policy')}</a></span>
            </label>
            <label className="check">
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} />
              <span>{app.t('auth.marketing', 'Yes, send me promotions, bonuses and free spins')}</span>
            </label>
          </>}

          {err && <p className="err">{err}</p>}
          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy || (mode === 'join' && (!over18 || !acceptTerms))} onClick={submit}>{mode === 'join' ? app.t('auth.join.submit', 'Create account') : app.t('cta.login', 'Log in')}</button>
          {mode === 'login' && <div className="switchline" style={{ marginTop: 6 }}><a onClick={() => { setErr(''); app.setAuthModal('forgot') }}>{app.t('auth.forgot', 'Forgot password?')}</a></div>}
          <div className="switchline">
            {mode === 'join'
              ? <>{app.t('auth.haveAccount', 'Already have an account?')} <a onClick={() => { setErr(''); app.setAuthModal('login') }}>{app.t('auth.loginLink', 'Login')}</a></>
              : <>{app.t('auth.newHere', 'New here?')} <a onClick={() => { setErr(''); app.setAuthModal('join') }}>{app.t('hero.join', 'Join now')}</a></>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Forgot password: ask for the email, always show the same confirmation so no
// one can learn whether an address is registered (no account enumeration).
function ForgotModal() {
  const app = useApp()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const submit = async () => {
    if (busy || !email.trim()) return
    setBusy(true)
    await app.requestPasswordReset(email.trim())
    setBusy(false); setSent(true)
  }
  return (
    <div className="overlay open" onClick={ev => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('auth.forgot.title', 'Reset your password')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          {sent ? <>
            <p className="muted" style={{ marginTop: 0 }}>{app.t('auth.forgot.sentPre', 'If an account exists for ')}<b>{email.trim()}</b>{app.t('auth.forgot.sentPost', ', we have sent a link to reset your password. Check your inbox and spam folder.')}</p>
            <button className="btn orange" onClick={() => app.setAuthModal('login')}>{app.t('auth.backToLogin', 'Back to login')}</button>
          </> : <>
            <p className="muted" style={{ marginTop: 0 }}>{app.t('auth.forgot.intro', 'Enter your email and we will send you a link to set a new password.')}</p>
            <div className="field"><label>{app.t('auth.email', 'Email')}</label><input type="email" value={email} placeholder={app.t('auth.emailPh', 'you@email.com')} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
            <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy || !email.trim()} onClick={submit}>{app.t('auth.forgot.send', 'Send reset link')}</button>
            <div className="switchline"><a onClick={() => app.setAuthModal('login')}>{app.t('auth.backToLogin', 'Back to login')}</a></div>
          </>}
        </div>
      </div>
    </div>
  )
}

// Reset: set a new password using the single-use token captured from the link.
// The token itself lives only in memory (store.resetToken) and was stripped from
// the URL on load. Generic errors only, so invalid vs expired is indistinguishable.
function ResetModal() {
  const app = useApp()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const submit = async () => {
    if (busy) return
    setErr('')
    if (pass.length < 12) { setErr(app.t('auth.err.pass12', 'Password must be at least 12 characters')); return }
    if (pass !== confirm) { setErr(app.t('auth.err.match', 'Passwords do not match')); return }
    setBusy(true)
    const e = await app.resetPassword(pass)
    setBusy(false)
    if (e) { setErr(e); return }
    setDone(true)
  }
  return (
    <div className="overlay open" onClick={ev => { if (ev.target === ev.currentTarget) app.setAuthModal(null) }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('auth.reset.title', 'Set a new password')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={() => app.setAuthModal(null)}>✕</button></div>
        <div className="modal-body">
          {done ? <>
            <p className="muted" style={{ marginTop: 0 }}>{app.t('auth.reset.done', 'Your password has been updated and you have been signed out on all devices. Please log in with your new password.')}</p>
            <button className="btn orange" onClick={() => app.setAuthModal('login')}>{app.t('auth.reset.goLogin', 'Go to login')}</button>
          </> : <>
            <div className="field"><label>{app.t('auth.newPassword', 'New password')} <span className="hint">{app.t('auth.pass12hint', 'at least 12 characters')}</span></label><input type="password" value={pass} placeholder="••••••••" onChange={e => setPass(e.target.value)} /></div>
            <div className="field"><label>{app.t('auth.confirmPassword', 'Confirm password')}</label><input type="password" value={confirm} placeholder="••••••••" onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
            {err && <p className="err">{err}</p>}
            <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={submit}>{app.t('auth.reset.update', 'Update password')}</button>
          </>}
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
  const [mode, setMode] = useState<'real' | 'demo'>('real')
  const [demoBal, setDemoBal] = useState(1000)
  if (!app.user) return null
  const u = app.user
  const rollReels = () => setReels([0, 1, 2].map(() => SYMS[Math.floor(Math.random() * SYMS.length)]))
  const spin = async () => {
    if (busy) return
    if (mode === 'demo') {
      // Demo play never touches the wallet or the backend: pure local fun credits.
      if (demoBal < bet) { app.showToast(app.t('game.demoOut', 'Out of demo credits — reset to keep playing')); return }
      rollReels()
      const w = Math.random() < 0.42 ? +(bet * (Math.random() * 4 + 1.5)).toFixed(2) : 0
      setDemoBal(b => +(b - bet + w).toFixed(2)); setLastBet(0)
      if (w > 0) { setWin(app.t('game.win', 'WIN {amount}!', { amount: fmt(w) })); setBurst(b => b + 1); setTimeout(() => setWin(''), 900) } else setWin('')
      return
    }
    setBusy(true)
    try {
      const r = await app.placeBet(game, bet)
      if (!r.ok) { app.showToast(r.error); return }
      rollReels()
      setLastBet(bet)
      if (r.win > 0) { setWin(app.t('game.win', 'WIN {amount}!', { amount: fmt(r.win) })); setBurst(b => b + 1); setTimeout(() => setWin(''), 900) } else setWin('')
    } finally { setBusy(false) }
  }
  const rollback = async () => {
    if (busy) return
    if (lastBet === 0) { app.showToast(app.t('game.nothingRollback', 'Nothing to roll back')); return }
    setBusy(true)
    try {
      const r = await app.rollback(lastBet)
      if (!r.ok) { app.showToast(r.error); return }
      setLastBet(0); app.showToast(app.t('game.rolledBack', 'Last round rolled back'))
    } finally { setBusy(false) }
  }
  const adj = (d: number) => { const i = BET_STEPS.indexOf(bet); setBet(BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, i + d))]) }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      {burst > 0 && <Confetti key={burst} />}
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3 style={{ fontSize: 16 }}>{game.name}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="seg" style={{ marginBottom: 10 }}><button className={mode === 'real' ? 'on' : ''} onClick={() => { setMode('real'); setWin('') }}>{app.t('game.real', 'Real money')}</button><button className={mode === 'demo' ? 'on' : ''} onClick={() => { setMode('demo'); setWin('') }}>{app.t('game.demo', 'Demo')}</button></div>
          <div className="stage" style={{ background: `linear-gradient(140deg,${game.grad[0]},${game.grad[1]})` }}>
            <div className="sbal">{mode === 'demo' ? app.t('game.demoCredits', 'Demo credits') : app.t('account.balance', 'Balance')} {fmt(mode === 'demo' ? demoBal : u.balance)}</div>
            <div className="reel">{reels.map((s, i) => <span key={i}>{s}</span>)}</div>
            {win && <div className="winflash show">{win}</div>}
          </div>
          <div style={{ fontSize: 12, color: '#7A8290', marginBottom: 11 }}>{game.studio} · {mode === 'demo' ? app.t('game.demoPlay', 'demo play, no real money') : app.t('game.realMoney', 'real money')}</div>
          <div className="betbar"><span className="muted" style={{ fontWeight: 800 }}>{app.t('game.betPerSpin', 'Bet per spin')}</span><span className="pill">{fmt(bet)}</span></div>
          <div className="row2" style={{ marginBottom: 10 }}><button className="btn sec" onClick={() => adj(-1)}>{app.t('game.betMinus', '– Bet')}</button><button className="btn sec" onClick={() => adj(1)}>{app.t('game.betPlus', '+ Bet')}</button></div>
          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={spin}>{mode === 'demo' ? app.t('game.spinDemo', 'Spin · demo') : app.t('game.spin', 'Spin')}</button>
          {mode === 'real'
            ? <button className="btn ghost" style={{ marginTop: 8 }} disabled={busy} onClick={rollback}>{app.t('game.rollback', 'Rollback last round')}</button>
            : <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => { setDemoBal(1000); app.showToast(app.t('game.demoReset', 'Demo credits reset')) }}>{app.t('game.resetDemo', 'Reset demo credits')}</button>}
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

// Live signed-in sessions (backend mode). In mock/demo mode there is no session
// service, so we show only the current device and no fabricated history (MRB-134).
function SessionsCard() {
  const app = useApp()
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () => { void app.listSessions().then(setSessions) }
  useEffect(() => { if (app.supportsSecurity) load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  if (!app.supportsSecurity) {
    return (
      <div className="card2">
        <div className="h">{app.t('account.devices', 'Signed-in devices')}</div>
        <div className="lrow"><div><div className="lt">{app.t('account.thisDevice', 'This device')}</div><div className="ls">{app.t('account.activeNow', 'Active now')}</div></div><span style={{ fontSize: 11, fontWeight: 800, background: '#E6F7EF', color: '#0F9D63', padding: '3px 10px', borderRadius: 999 }}>{app.t('account.current', 'Current')}</span></div>
      </div>
    )
  }
  const others = (sessions ?? []).filter(x => !x.current).length
  return (
    <div className="card2">
      <div className="h">{app.t('account.devices', 'Signed-in devices')}</div>
      {sessions === null
        ? <div className="ls">{app.t('common.loading', 'Loading…')}</div>
        : sessions.length === 0
          ? <div className="ls">{app.t('account.noSessions', 'No active sessions found.')}</div>
          : sessions.map(x => (
            <div className="lrow" key={x.id}>
              <div>
                <div className="lt">{x.current ? app.t('account.thisDevice', 'This device') : (x.userAgent || app.t('account.unknownDevice', 'Unknown device'))}</div>
                <div className="ls">{x.current ? app.t('account.activeNow', 'Active now') : app.t('account.signedInOn', 'Signed in {when}', { when: new Date(x.createdAt).toLocaleDateString() })}</div>
              </div>
              {x.current && <span style={{ fontSize: 11, fontWeight: 800, background: '#E6F7EF', color: '#0F9D63', padding: '3px 10px', borderRadius: 999 }}>{app.t('account.current', 'Current')}</span>}
            </div>
          ))}
      <div style={{ marginTop: 8 }}>
        <button className={'btn sec' + (busy ? ' busy' : '')} disabled={busy || others === 0} onClick={async () => {
          setBusy(true)
          const r = await app.closeOtherSessions()
          setBusy(false)
          if (r.ok) { app.showToast(app.t('account.signedOutOthersN', 'Signed out of {n} other session(s)', { n: String(r.revoked) })); load() }
          else app.showToast(r.error)
        }}>{app.t('account.signOutOthers', 'Sign out other devices')}</button>
      </div>
    </div>
  )
}

// Email verification + two-factor management (backend mode). Optional flows: the
// verify banner shows for PENDING_VERIFICATION / unverified email; 2FA enrol shows
// the secret for manual entry (recovery codes shown exactly once) — MRB-134 / MRB-24.
function SecurityCard() {
  const app = useApp()
  const u = app.user!
  const [st, setSt] = useState<TotpStatusResponse | null>(null)
  const [enrol, setEnrol] = useState<TotpEnrolmentResponse | null>(null)
  const [mode2, setMode2] = useState<'idle' | 'enrol' | 'disable'>('idle')
  const [code, setCode] = useState('')
  const [pwd, setPwd] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const loadStatus = () => { void app.totpStatus().then(setSt) }
  useEffect(() => { if (app.supportsSecurity) loadStatus() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  // Only in backend mode (explicit flags). Mock/demo accounts have no email-verification concept.
  const needVerify = u.emailVerified === false || u.status === 'PENDING_VERIFICATION'
  if (!app.supportsSecurity && !needVerify) return null

  return (
    <div className="card2">
      <div className="h">{app.t('account.security', 'Security')}</div>

      {needVerify && (
        <div className="lrow" style={{ display: 'block' }}>
          <div className="lt" style={{ color: '#B26A00' }}>{app.t('account.verifyEmail', 'Verify your email')}</div>
          <div className="ls">{app.t('account.verifyEmailSub', 'Check your inbox for the verification link to unlock everything.')}</div>
          {app.supportsSecurity && (
            <div style={{ marginTop: 8 }}>
              <button className={'btn sec' + (busy ? ' busy' : '')} disabled={busy || resent} onClick={async () => {
                setBusy(true); const r = await app.resendVerification(); setBusy(false)
                if (r.ok) { setResent(true); app.showToast(app.t('account.verifySent', 'Verification email sent')) } else app.showToast(r.error)
              }}>{resent ? app.t('account.verifySentShort', 'Sent ✓') : app.t('account.resend', 'Resend email')}</button>
            </div>
          )}
        </div>
      )}

      {app.supportsSecurity && (
        <div className="lrow" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div className="lt">{app.t('account.twoFA', 'Two-factor authentication')}</div><div className="ls">{st?.enabled ? app.t('account.twoFAon', 'On — an extra step protects your login') : app.t('account.twoFAoff', 'Off — add a second step at login')}</div></div>
            {st?.enabled
              ? <span className="pill" {...clickable(() => { setMode2(m => m === 'disable' ? 'idle' : 'disable'); setCode(''); setPwd('') })}>{app.t('account.manage', 'Manage')} ›</span>
              : <span className="pill" {...clickable(async () => {
                  if (mode2 === 'enrol') { setMode2('idle'); return }
                  setBusy(true); const e = await app.totpEnrol(); setBusy(false)
                  if (e) { setEnrol(e); setMode2('enrol'); setCode('') } else app.showToast(app.t('account.twoFAfail', 'Could not start setup. Please try again.'))
                })}>{app.t('account.enable', 'Enable')} ›</span>}
          </div>

          {mode2 === 'enrol' && enrol && !codes && (
            <div className="excl">
              <p>{app.t('account.twoFAstep1', 'Add this key to your authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code it shows.')}</p>
              <div className="ls" style={{ wordBreak: 'break-all', marginBottom: 8 }}><strong>{app.t('account.secretKey', 'Setup key')}:</strong> <code>{enrol.secret}</code></div>
              <input type="text" inputMode="numeric" value={code} placeholder={app.t('account.6digit', '6-digit code')} onChange={e => setCode(e.target.value.replace(/[^0-9 ]/g, ''))} />
              <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy || code.trim().length < 6} onClick={async () => {
                setBusy(true); const r = await app.totpActivate(code.trim()); setBusy(false)
                if (r.ok) { setCodes(r.recoveryCodes); loadStatus() } else app.showToast(r.error)
              }}>{app.t('account.turnOn', 'Turn on 2FA')}</button>
            </div>
          )}

          {codes && (
            <div className="excl">
              <p style={{ fontWeight: 800 }}>{app.t('account.recoveryTitle', 'Save your recovery codes')}</p>
              <p>{app.t('account.recoverySub', 'Each works once if you lose your authenticator. They are shown only now — store them somewhere safe.')}</p>
              <div className="ls" style={{ fontFamily: 'monospace', lineHeight: 1.9 }}>{codes.map(c => <div key={c}>{c}</div>)}</div>
              <button className="btn orange" onClick={() => { setCodes(null); setMode2('idle'); setEnrol(null); app.showToast(app.t('account.twoFAon2', 'Two-factor authentication is on')) }}>{app.t('account.savedCodes', "I've saved them")}</button>
            </div>
          )}

          {mode2 === 'disable' && (
            <div className="excl">
              <p>{app.t('account.twoFAdisableP', 'Enter your password and a current code to turn off two-factor authentication.')}</p>
              <input type="password" value={pwd} placeholder={app.t('auth.password', 'Password')} onChange={e => setPwd(e.target.value)} />
              <input type="text" inputMode="numeric" value={code} placeholder={app.t('account.6digit', '6-digit code')} onChange={e => setCode(e.target.value.replace(/[^0-9 ]/g, ''))} />
              <button className={'btn' + (busy ? ' busy' : '')} disabled={busy || !pwd || code.trim().length < 6} onClick={async () => {
                setBusy(true); const r = await app.totpDisable(pwd, code.trim()); setBusy(false)
                if (r.ok) { setMode2('idle'); setPwd(''); setCode(''); loadStatus(); app.showToast(app.t('account.twoFAoff2', 'Two-factor authentication turned off')) } else app.showToast(r.error)
              }}>{app.t('account.turnOff', 'Turn off 2FA')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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

  // Self-exclusion periods keep their English values (the API contract) but display
  // translated. Map the stored value to its translation key + fallback.
  const PERIODS: [string, string, string][] = [
    ['24 hours', 'account.period.24h', '24 hours'],
    ['1 week', 'account.period.1w', '1 week'],
    ['1 month', 'account.period.1m', '1 month'],
    ['6 months', 'account.period.6m', '6 months'],
    ['Permanent', 'account.period.perm', 'Permanent'],
  ]
  const periodLabel = (p: string) => { const m = PERIODS.find(x => x[0] === p); return m ? app.t(m[1], m[2]) : p }

  const showVal = (k: LimitKind) => (LIMIT_ROWS.find(r => r.k === k)!.money ? fmt(u.limits[k]) : app.t('account.mins', '{n} min', { n: String(u.limits[k]) }))
  const startEdit = (k: LimitKind) => { setEditKind(k); setEditVal(String(u.limits[k])); track('rg_limit_opened', { kind: k }) }
  const saveEdit = async () => {
    if (busy || !editKind) return
    const v = parseFloat(editVal)
    if (!v || v <= 0) { app.showToast(app.t('account.enterValid', 'Enter a valid amount')); return }
    setBusy(true)
    try {
      const r = await app.setLimit(editKind, v)
      if (!r.ok) { app.showToast(r.error); return }
      app.showToast(r.outcome === 'lowered' ? app.t('account.limitLowered', 'Limit lowered, effective now') : app.t('account.increaseRequested', 'Increase requested, effective in 24 hours'))
      setEditKind(null)
    } finally { setBusy(false) }
  }
  const confirmExcl = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await app.selfExclude(exclPeriod)
      if (!r.ok) { app.showToast(r.error); return }
      app.showToast(app.t('account.exclActive', 'Self-exclusion active for {period}', { period: periodLabel(exclPeriod) }))
      setExclOpen(false); setExclType('')
    } finally { setBusy(false) }
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('nav.account', 'Account')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="prof">
            <div className="avatar">{(u.username || u.email)[0].toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{u.username || u.email.split('@')[0]}</div>
              <div className="muted" style={{ fontSize: 13 }}>{u.email}</div>
              {(u.country || u.phone) && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{u.country ? `${flag(u.country)} ${byCode(u.country)?.name ?? u.country}` : ''}{u.phone ? ` · ${u.phone}` : ''}</div>}
              <div className="kyc" style={{ marginTop: 6 }}>{app.t('account.kyc', 'KYC verified')}{u.marketing ? app.t('account.promosOn', ' · promos on') : ''}</div>
            </div>
          </div>
          <div className="balrow">
            <div><div className="brl">{app.t('account.balance', 'Balance')}</div><div className="brv">{fmt(u.balance)}</div></div>
            <div><div className="brl">{app.t('account.bonus', 'Bonus')}</div><div className="brv">{fmt(u.bonus)}</div></div>
            <div><div className="brl">{app.t('account.points', 'Points')}</div><div className="brv">{u.points.toLocaleString('en-US')}</div></div>
          </div>

          {u.bonus > 0 && (() => {
            const target = Math.round(u.bonus * 35)
            const wagered = Math.min(target, u.points)
            const pct = target ? Math.min(100, Math.round((wagered / target) * 100)) : 0
            return (
              <div className="card2">
                <div className="h">{app.t('account.activeBonus', 'Active bonus')}</div>
                <div className="lrow" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div className="lt">{app.t('account.welcomeBonus', 'Welcome bonus')} · {fmt(u.bonus)}</div>
                    <div className="ls">{fmt(wagered)} / {fmt(target)}</div>
                  </div>
                  <div className="wager-bar"><span style={{ width: pct + '%' }} /></div>
                  <div className="ls" style={{ marginTop: 5 }}>{app.t('account.wagerInfo', '{pct}% wagered · 35x requirement · slots contribute 100%', { pct: String(pct) })}</div>
                </div>
              </div>
            )
          })()}

          <SessionsCard />
          <SecurityCard />

          <div className="card2" style={{ padding: '4px 17px' }}>
            <div className="li" aria-label={app.t('account.openWalletAria', 'Open wallet and transactions')} {...clickable(() => app.openModal({ type: 'wallet' }))}><div className="lic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></div><div><div className="lt">{app.t('account.walletTx', 'Wallet & transactions')}</div><div className="ls">{app.t('account.walletTxSub', 'Deposits, withdrawals, play')}</div></div><div className="chev">›</div></div>
          </div>
          <div className="rgbanner"><div><div style={{ fontWeight: 900, fontSize: 15 }}>{app.t('menu.rg', 'Responsible Gambling')}</div><div className="muted" style={{ fontSize: 12 }}>{app.t('account.rgSub', 'Decreases apply now. Increases wait 24 hours and can be cancelled.')}</div></div></div>

          <div className="card2">
            <div className="h">{app.t('account.limits', 'Limits')}</div>
            {LIMIT_ROWS.map(r => {
              const rowLabel = app.t('account.limit.' + r.k, r.label)
              return (
              <div className="lrow" key={r.k} style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div className="lt">{rowLabel}</div><div className="ls">{app.t('account.limit.' + r.k + 'Sub', r.sub)}</div></div>
                  <span className="pill" aria-label={app.t('account.changeAria', 'Change {label}', { label: rowLabel })} {...clickable(() => (editKind === r.k ? setEditKind(null) : startEdit(r.k)))}>{showVal(r.k)} ›</span>
                </div>
                {editKind === r.k && (
                  <div className="lim-edit">
                    <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} />
                    <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={saveEdit}>{app.t('account.save', 'Save')}</button>
                    <button className="btn sec" onClick={() => setEditKind(null)}>{app.t('account.cancel', 'Cancel')}</button>
                  </div>
                )}
                {u.pending[r.k] && (
                  <div className="pending-row">
                    ⏳ {app.t('account.pending', 'Increase to {val} pending, effective in {h}h', { val: r.money ? fmt(u.pending[r.k]!.value) : app.t('account.mins', '{n} min', { n: String(u.pending[r.k]!.value) }), h: String(hrsLeft(u.pending[r.k]!.at)) })}
                    <span className="cancel" {...clickable(() => { void app.cancelPending(r.k); app.showToast(app.t('account.pendingCancelled', 'Pending increase cancelled')) })}>{app.t('account.cancel', 'Cancel')}</span>
                  </div>
                )}
              </div>
              )
            })}
          </div>

          <div className="card2">
            <div className="lrow"><div><div className="lt" id="rc-label">{app.t('account.rc', 'Reality checks')}</div><div className="ls">{app.t('account.rcSub', 'Pop-up with time and spend')}</div></div><div role="switch" aria-checked={u.rc} aria-labelledby="rc-label" tabIndex={0} className={'toggle' + (u.rc ? ' on' : '')} onClick={() => { void app.setRealityChecks(!u.rc); app.showToast(!u.rc ? app.t('account.rcToastOn', 'Reality checks on') : app.t('account.rcToastOff', 'Reality checks off')) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void app.setRealityChecks(!u.rc); app.showToast(!u.rc ? app.t('account.rcToastOn', 'Reality checks on') : app.t('account.rcToastOff', 'Reality checks off')) } }} /></div>
            <div className="lrow" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div className="lt" style={{ color: '#E23B3B' }}>{app.t('account.selfExcl', 'Self-exclusion')}</div><div className="ls">{app.t('account.selfExclSub', 'Blocks all play for the chosen period')}</div></div>
                {u.excluded
                  ? <span className="pill" style={{ background: '#FDE7E7', color: '#E23B3B' }}>{app.t('account.active', 'Active')}</span>
                  : <span className="pill" aria-label={app.t('account.startExclAria', 'Start self-exclusion')} {...clickable(() => setExclOpen(o => !o))}>{app.t('account.start', 'Start')} ›</span>}
              </div>
              {u.excluded && <div style={{ marginTop: 8 }}><span className="demoreset" {...clickable(() => { void app.liftExclusion(); app.showToast(app.t('account.exclLifted', 'Self-exclusion lifted (demo)')) })}>{app.t('account.lift', 'Lift (demo only)')}</span></div>}
              {!u.excluded && exclOpen && (
                <div className="excl">
                  <select value={exclPeriod} onChange={e => setExclPeriod(e.target.value)}>
                    {PERIODS.map(([p, k, f]) => <option key={p} value={p}>{app.t(k, f)}</option>)}
                  </select>
                  <p>{app.t('account.exclConfirmP', 'This blocks all play and login for {period}. It cannot be undone early. To confirm, type CONFIRM below.', { period: periodLabel(exclPeriod) })}</p>
                  <input type="text" value={exclType} placeholder={app.t('account.typeConfirm', 'Type CONFIRM')} onChange={e => setExclType(e.target.value)} />
                  <button className={'btn' + (busy ? ' busy' : '')} disabled={busy || exclType.trim().toUpperCase() !== 'CONFIRM'} onClick={confirmExcl}>{app.t('account.confirmExcl', 'Confirm self-exclusion')}</button>
                </div>
              )}
            </div>
          </div>

          <button className="btn sec" onClick={() => { void app.logout(); app.closeModal(); app.showToast(app.t('account.loggedOut', 'Logged out')) }}>{app.t('account.logout', 'Log out')}</button>
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
    setTimeout(() => { setReward(r.prize); app.showToast(app.t('chest.toast', 'Mystery Chest: {prize}', { prize: r.prize })) }, 560)
  }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('chest.title', 'Mystery Chest')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className={'chestwrap' + (opened || claimed ? ' chestopen' : ' shake')} dangerouslySetInnerHTML={{ __html: chestModalSVG() }} />
          <div className="wresult">{reward ? <>{app.t('chest.foundPre', 'You found ')}<b>{reward}</b>!</> : claimed ? app.t('chest.comeBack', 'Come back tomorrow for another chest.') : app.t('chest.tapReveal', 'Tap to reveal your reward!')}</div>
          <button className="btn orange" disabled={claimed || opened} onClick={open}>{claimed || opened ? app.t('chest.claimed', 'Claimed') : app.t('chest.open', 'Open chest')}</button>
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
      setResult(r.prize === 'Try again' ? app.t('wheel.tryAgain', 'Better luck tomorrow!') : app.t('wheel.won', 'You won {prize}', { prize: r.prize }))
      app.showToast(r.prize === 'Try again' ? app.t('wheel.soClose', 'So close! Try again tomorrow.') : app.t('wheel.toast', 'Daily wheel: {prize}', { prize: r.prize }))
    }, 4300)
  }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{app.t('wheel.title', 'Daily Bonus Wheel')}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <p className="muted center" style={{ marginTop: 0 }}>{app.t('wheel.sub', 'Spin once a day for a free bonus. Good luck!')}</p>
          <div className="wheelwrap"><div className="pointer" /><div dangerouslySetInnerHTML={{ __html: wheelSVG() }} /></div>
          <div className="wresult">{result || (claimed ? app.t('wheel.comeBack', 'Come back tomorrow for another spin.') : '')}</div>
          <button className="btn orange" disabled={claimed || spun} onClick={spin}>{claimed ? app.t('wheel.comeBackBtn', 'Come back tomorrow') : spun ? app.t('wheel.spinning', 'Spinning…') : app.t('wheel.spin', 'SPIN')}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Info / legal pages ---------------- */
const INFO_DOCS = LEGAL

function InfoModal({ infoKey }: { infoKey: string }) {
  const app = useApp()
  const doc = INFO_DOCS[infoKey] ?? { title: 'MrBen', html: '<p>Coming soon.</p>' }
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{doc.title}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="doc" style={{ maxHeight: '62vh', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: doc.html }} />
          {infoKey === 'rg-policy' && (
            <button className="btn orange" onClick={() => { app.closeModal(); if (app.user) app.openModal({ type: 'account' }); else app.setAuthModal('login') }}>{app.t('info.manageLimits', 'Manage my limits')}</button>
          )}
          {infoKey === 'cookies' ? (
            <div className="row2">
              <button className="btn sec" onClick={() => { app.closeModal(); app.showToast(app.t('cookie.toastEssential', 'Essential cookies only')) }}>{app.t('cookie.essential', 'Essential only')}</button>
              <button className="btn orange" onClick={() => { app.closeModal(); app.showToast(app.t('cookie.toastAll', 'All cookies accepted')) }}>{app.t('cookie.acceptAll', 'Accept all')}</button>
            </div>
          ) : infoKey !== 'rg-policy' && (
            <button className="btn sec" onClick={app.closeModal}>{app.t('common.close', 'Close')}</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Launch blocked (MRB-37) ---------------- */
const BLOCK_META: Record<LaunchBlock, { title: string; titleKey: string; icon: string }> = {
  AUTH: { title: 'Sign in to play', titleKey: 'blocked.auth.title', icon: '🔒' },
  GEO: { title: 'Not available in your region', titleKey: 'blocked.geo.title', icon: '🌍' },
  WALLET_PROVISIONING: { title: 'Wallet almost ready', titleKey: 'cashier.walletTitle', icon: '⏳' },
  SELF_EXCLUDED: { title: 'Play is paused', titleKey: 'blocked.excluded.title', icon: '🛡️' },
  DEMO_UNAVAILABLE: { title: 'No demo for this game', titleKey: 'blocked.demo.title', icon: '🎬' },
}
function BlockModal({ reason, message }: { reason: LaunchBlock; message: string }) {
  const app = useApp()
  const meta = BLOCK_META[reason]
  const title = app.t(meta.titleKey, meta.title)
  // A relevant next step per reason, never a dead end (MRB-37 R4/R5 spirit).
  const cta =
    reason === 'DEMO_UNAVAILABLE' ? { label: app.t('blocked.auth.title', 'Sign in to play'), act: () => { app.closeModal(); app.setAuthModal('join') } }
    : reason === 'SELF_EXCLUDED' ? { label: app.t('menu.rg', 'Responsible Gambling'), act: () => { app.closeModal(); app.openModal({ type: 'account' }) } }
    : reason === 'WALLET_PROVISIONING' ? { label: app.t('blocked.openCashier', 'Open cashier'), act: () => { app.closeModal(); app.openModal({ type: 'wallet' }) } }
    : null
  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: 400 }}>
        <div className="modal-head"><h3>{title}</h3><button className="x" aria-label={app.t('common.close', 'Close')} onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 8 }} aria-hidden="true">{meta.icon}</div>
          <p className="muted" style={{ marginTop: 0, textAlign: 'center', lineHeight: 1.55 }}>{message}</p>
          {cta && <button className="btn orange" onClick={cta.act}>{cta.label}</button>}
          <button className="btn ghost" onClick={app.closeModal}>{app.t('common.close', 'Close')}</button>
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
      {app.modal?.type === 'wallet' && <Cashier />}
      {app.modal?.type === 'blocked' && <BlockModal reason={app.modal.reason} message={app.modal.message} />}
      {app.modal?.type === 'game' && <GameModal game={app.modal.game} />}
      {app.modal?.type === 'account' && <AccountModal />}
      {app.modal?.type === 'chest' && <ChestModal />}
      {app.modal?.type === 'wheel' && <WheelModal />}
      {app.modal?.type === 'info' && <InfoModal infoKey={app.modal.key} />}
    </>
  )
}
