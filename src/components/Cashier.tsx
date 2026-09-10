import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { fmt } from '../data'
import { track } from '../analytics'
import {
  depositMethods, withdrawMethods, cryptoAssets, depositBonuses, bonusGrant,
} from '../data/payments'
import type { DepositBonus } from '../data/payments'

type Tab = 'deposit' | 'withdraw' | 'history'
const QUICK = [20, 50, 100, 250]

// A decorative QR rendered from the address so the deposit screen shows the shape
// a player expects. The real scannable QR renders when the backend issues a live
// deposit address; this is a sample, and it says so.
function PseudoQR({ seed, color }: { seed: string; color: string }) {
  const n = 21
  const cells = useMemo(() => {
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
    const out: boolean[] = []
    for (let i = 0; i < n * n; i++) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; out.push(((h >>> 0) & 7) < 3) }
    return out
  }, [seed])
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="132" height="132" style={{ background: '#fff', borderRadius: 8, padding: 4 }} aria-hidden="true">
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n)
        if (finder(x, y)) return null
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0b1020" /> : null
      })}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([fx, fy], i) => (
        <g key={i}>
          <rect x={fx} y={fy} width={7} height={7} fill="none" stroke={color} strokeWidth={1} />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} fill={color} />
        </g>
      ))}
    </svg>
  )
}

export default function Cashier() {
  const app = useApp()
  const [tab, setTab] = useState<Tab>('deposit')
  if (!app.user) return null
  const u = app.user

  // Withdrawable = cash balance. Bonus funds are locked until wagered (MRB-61 R4).
  const withdrawable = Math.max(0, u.balance)
  const bonusLocked = Math.max(0, u.bonus)

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) app.closeModal() }}>
      <div className="modal cashier" role="dialog" aria-modal="true" aria-label="Cashier">
        <div className="modal-head"><h3>Cashier</h3><button className="x" aria-label="Close" onClick={app.closeModal}>✕</button></div>
        <div className="modal-body">
          <div className="cash-bal">
            <div>
              <div className="cb-l">Available balance</div>
              <div className="cb-a">{fmt(u.balance)}</div>
            </div>
            <div className="cb-side">
              <div><span className="cb-k">Withdrawable</span><span className="cb-v">{fmt(withdrawable)}</span></div>
              <div><span className="cb-k">Bonus (locked)</span><span className="cb-v">{fmt(bonusLocked)}</span></div>
            </div>
          </div>

          {u.walletReady === false ? (
            <div className="wallet-wait">
              <div className="ww-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></div>
              <div className="ww-t">Wallet almost ready</div>
              <div className="ww-s">We are finishing setting up your payment wallet. Deposits and withdrawals open as soon as it is provisioned. You can still explore the games in demo.</div>
            </div>
          ) : (
            <>
              <div className="seg seg3">
                <button className={tab === 'deposit' ? 'on' : ''} onClick={() => setTab('deposit')}>Deposit</button>
                <button className={tab === 'withdraw' ? 'on' : ''} onClick={() => setTab('withdraw')}>Withdraw</button>
                <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
              </div>
              {tab === 'deposit' && <DepositTab />}
              {tab === 'withdraw' && <WithdrawTab withdrawable={withdrawable} bonusLocked={bonusLocked} />}
              {tab === 'history' && <HistoryTab />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Deposit ---------------- */
function DepositTab() {
  const app = useApp()
  const u = app.user!
  const [methodK, setMethodK] = useState(depositMethods[0].k)
  const [amount, setAmount] = useState('50')
  const [assetIdx, setAssetIdx] = useState(0)
  const [bonusId, setBonusId] = useState<string>('welcome')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)

  const method = depositMethods.find(m => m.k === methodK)!
  const value = parseFloat(amount || '0')

  // Bonuses the player is eligible for: first-deposit offers only before an FTD.
  const offers = depositBonuses.filter(b => !b.firstOnly || !u.firstDepositDone)
  const bonus: DepositBonus | null = bonusId === 'none' ? null : (offers.find(b => b.id === bonusId) ?? null)
  const grant = bonus ? bonusGrant(bonus, value) : 0

  const confirm = async () => {
    if (busy) return
    if (value < method.min) { app.showToast(`Minimum ${method.label} deposit is ${fmt(method.min)}`); return }
    if (value > method.max) { app.showToast(`Maximum is ${fmt(method.max)}`); return }
    setBusy(true)
    track('deposit_started', { method: method.k })
    try {
      const r = await app.deposit(value, method.k)
      if (!r.ok) { app.showToast(r.error); return }
      setPending(true)
    } finally { setBusy(false) }
  }

  return (
    <div className="cash-pane">
      <div className="methods-row">
        {depositMethods.map(m => (
          <button key={m.k} className={'method-chip' + (methodK === m.k ? ' sel' : '')} onClick={() => { setMethodK(m.k); setPending(false) }}>
            <span className="mc-dot" style={{ background: m.color }} />
            <span className="mc-t">{m.label}</span>
            <span className="mc-s">{m.sub}</span>
          </button>
        ))}
      </div>

      {method.type === 'crypto' ? (
        <CryptoDeposit assetIdx={assetIdx} setAssetIdx={setAssetIdx} bonus={bonus} />
      ) : pending ? (
        <PendingState method={method} amount={value} onDone={() => setPending(false)} />
      ) : (
        <>
          <div className="amtin"><span>€</span><input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} aria-label="Deposit amount" /></div>
          <div className="quick">{QUICK.map(v => <button key={v} className={value === v ? 'on' : ''} onClick={() => setAmount(String(v))}>€{v}</button>)}</div>
          <div className="minmax">Min {fmt(method.min)} · Max {fmt(method.max)}{method.feePct > 0 ? ` · ${method.feePct}% fee` : ' · no fee'}</div>

          <BonusPicker offers={offers} bonusId={bonusId} setBonusId={setBonusId} deposit={value} />

          <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy} onClick={confirm}>
            Deposit {fmt(value)}{grant > 0 ? ` + ${fmt(grant)} bonus` : ''}
          </button>
        </>
      )}
    </div>
  )
}

function CryptoDeposit({ assetIdx, setAssetIdx, bonus }: { assetIdx: number; setAssetIdx: (i: number) => void; bonus: DepositBonus | null }) {
  const app = useApp()
  const a = cryptoAssets[assetIdx]
  const copy = async () => {
    try { await navigator.clipboard.writeText(a.address); app.showToast('Address copied') }
    catch { app.showToast('Copy failed — select and copy manually') }
  }
  return (
    <div className="crypto-dep">
      <div className="coin-row">
        {cryptoAssets.map((c, i) => (
          <button key={c.coin} className={'coin-chip' + (i === assetIdx ? ' sel' : '')} onClick={() => setAssetIdx(i)}>
            <span className="cc-dot" style={{ background: c.color }} />{c.coin}
          </button>
        ))}
      </div>

      {/* Network is the highest-risk field (R8): loud, above the address, repeated on the badge. */}
      <div className="net-warn">
        Send only <b>{a.coin}</b> on the <b>{a.network}</b> network. A transfer on any other network is lost and cannot be recovered.
      </div>

      <div className="addr-block">
        <PseudoQR seed={a.address} color={a.color} />
        <div className="addr-side">
          <div className="net-badge" style={{ borderColor: a.color, color: a.color }}>{a.network}</div>
          <div className="addr-label">Your {a.coin} deposit address</div>
          <div className="addr-val">{a.address}</div>
          <button className="btn small" onClick={copy}>Copy address</button>
        </div>
      </div>
      <div className="crypto-notes">
        Credited after <b>{a.minConf}</b> network confirmation{a.minConf > 1 ? 's' : ''} — usually a few minutes.
        {bonus ? <> Your <b>{bonus.name}</b> bonus is applied automatically when the deposit is credited.</> : null}
        <div className="sample-note">Sample address — a unique live address is issued to you once the payment provider is connected.</div>
      </div>
    </div>
  )
}

function BonusPicker({ offers, bonusId, setBonusId, deposit }: { offers: DepositBonus[]; bonusId: string; setBonusId: (id: string) => void; deposit: number }) {
  const selected = offers.find(b => b.id === bonusId) ?? null
  const grant = selected ? bonusGrant(selected, deposit) : 0
  return (
    <div className="bonus-pick">
      <div className="bp-h">Add a bonus</div>
      <div className="bp-opts">
        {offers.map(b => (
          <button key={b.id} className={'bp-opt' + (bonusId === b.id ? ' sel' : '')} onClick={() => setBonusId(b.id)}>{b.name}</button>
        ))}
        <button className={'bp-opt' + (bonusId === 'none' ? ' sel' : '')} onClick={() => setBonusId('none')}>No bonus</button>
      </div>
      {/* Terms shown inline before confirming — not behind a link or a skippable modal (R2). */}
      {selected && (
        <div className="bonus-terms">
          <div className="bt-row"><span>Bonus on this deposit</span><b>{grant > 0 ? fmt(grant) : `Deposit ${fmt(selected.minDeposit)}+ to qualify`}</b></div>
          <div className="bt-grid">
            <div><span>Wagering</span><b>{selected.wagering}×</b></div>
            <div><span>Expires</span><b>{selected.expiryDays} days</b></div>
            <div><span>Max bet</span><b>{fmt(selected.maxBet)}</b></div>
            <div><span>Excluded</span><b>{selected.excluded}</b></div>
          </div>
          <div className="bt-fine">Bonus must be wagered {selected.wagering}× before it becomes withdrawable cash.</div>
        </div>
      )}
    </div>
  )
}

function PendingState({ method, amount, onDone }: { method: { label: string; timing: string }; amount: number; onDone: () => void }) {
  return (
    <div className="pending-state">
      <div className="ps-spin" />
      <div className="ps-t">Deposit of {fmt(amount)} received</div>
      <div className="ps-s">{method.timing}</div>
      <button className="btn ghost" onClick={onDone}>Make another deposit</button>
    </div>
  )
}

/* ---------------- Withdraw ---------------- */
function WithdrawTab({ withdrawable, bonusLocked }: { withdrawable: number; bonusLocked: number }) {
  const app = useApp()
  const u = app.user!
  const [amount, setAmount] = useState('')
  const [methodK, setMethodK] = useState(withdrawMethods[0].k)
  const [busy, setBusy] = useState(false)

  // KYC gate (R5). In demo the player is treated as verified; a real pending/rejected
  // status shows the reason and a direct path to verify rather than a dead end.
  const kycNeeded = u.status === 'PENDING_VERIFICATION' || u.emailVerified === false
  const method = withdrawMethods.find(m => m.k === methodK)!
  const value = parseFloat(amount || '0')

  const confirm = async () => {
    if (busy) return
    if (value < method.min) { app.showToast(`Minimum withdrawal is ${fmt(method.min)}`); return }
    if (value > withdrawable) { app.showToast('Amount exceeds your withdrawable balance'); return }
    setBusy(true)
    track('withdrawal_started', { method: method.k })
    try {
      const r = await app.withdraw(value, method.k)
      if (!r.ok) { app.showToast(r.error); return }
      app.showToast(`Withdrawal of ${fmt(value)} requested`)
      setAmount('')
    } finally { setBusy(false) }
  }

  if (kycNeeded) {
    return (
      <div className="cash-pane">
        <div className="kyc-block">
          <div className="kb-ic">!</div>
          <div className="kb-t">Verify your identity to withdraw</div>
          <div className="kb-s">For your security and to meet our licence, we verify every player before their first withdrawal. It takes a couple of minutes.</div>
          <button className="btn orange" onClick={() => { app.closeModal(); app.openModal({ type: 'account' }) }}>Verify now</button>
        </div>
      </div>
    )
  }

  return (
    <div className="cash-pane">
      {/* Withdrawable breakdown answers "why can't I withdraw all of it" on-screen (R4). */}
      <div className="wd-break">
        <div className="wd-row"><span>Cash balance (withdrawable)</span><b>{fmt(withdrawable)}</b></div>
        <div className="wd-row locked"><span>Bonus (locked until wagered)</span><b>{fmt(bonusLocked)}</b></div>
        {bonusLocked > 0 && <div className="wd-why">Bonus funds become withdrawable once their wagering requirement is met. Only your cash balance can be withdrawn now.</div>}
      </div>

      <div className="amtin"><span>€</span><input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" aria-label="Withdrawal amount" /></div>
      <div className="quick">
        <button onClick={() => setAmount(String(withdrawable))}>Max {fmt(withdrawable)}</button>
        {[50, 100, 250].filter(v => v <= withdrawable).map(v => <button key={v} onClick={() => setAmount(String(v))}>€{v}</button>)}
      </div>

      <div className="methods-row">
        {withdrawMethods.map(m => (
          <button key={m.k} className={'method-chip' + (methodK === m.k ? ' sel' : '')} onClick={() => setMethodK(m.k)}>
            <span className="mc-dot" style={{ background: m.color }} />
            <span className="mc-t">{m.label}</span>
            <span className="mc-s">{m.sub}</span>
          </button>
        ))}
      </div>
      <div className="minmax">{method.timing}</div>

      <button className={'btn orange' + (busy ? ' busy' : '')} disabled={busy || value <= 0} onClick={confirm}>Withdraw {value > 0 ? fmt(value) : ''}</button>
    </div>
  )
}

/* ---------------- History ---------------- */
const KINDS = [
  { id: 'all', label: 'All' }, { id: 'deposit', label: 'Deposits' }, { id: 'withdraw', label: 'Withdrawals' },
  { id: 'bet', label: 'Bets' }, { id: 'win', label: 'Wins' }, { id: 'bonus', label: 'Bonus' },
] as const

function HistoryTab() {
  const app = useApp()
  const u = app.user!
  const [kind, setKind] = useState<string>('all')
  const rows = u.txns.filter(t => kind === 'all' || t.kind === kind)

  return (
    <div className="cash-pane">
      <div className="hist-filters">
        {KINDS.map(k => (
          <button key={k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>{k.label}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="hist-empty">No {kind === 'all' ? '' : kind + ' '}transactions yet.</div>
      ) : (
        <div className="hist-list">
          {rows.map(t => (
            <div className="hist-row" key={t.id}>
              <span className={'tk tk-' + t.kind}>{t.kind}</span>
              <div className="hr-mid">
                <div className="hr-l">{t.label}</div>
                <div className="hr-d">{new Date(t.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="hr-right">
                <div className={'hr-a ' + (t.kind === 'withdraw' || t.kind === 'bet' ? 'neg' : 'pos')}>{t.kind === 'withdraw' || t.kind === 'bet' ? '−' : '+'}{fmt(t.amount)}</div>
                <div className="hr-st">Completed</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="hist-note">New transactions can take a minute or two to appear while they settle.</div>
    </div>
  )
}
