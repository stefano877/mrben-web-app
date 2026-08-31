import { useApp } from '../store'

// Marketing page for the affiliate / partner program, plus a personal
// refer-a-friend link for signed-in players. "Apply" deep-links into the
// standalone MIG Affiliates platform.
const AFFILIATE_APP = 'https://mrigaming-affiliates.vercel.app'

export default function AffiliatePromo() {
  const app = useApp()
  const user = app.user
  const code = user ? 'p' + (user.id || user.username).replace(/[^a-zA-Z0-9]/g, '') : ''
  const refLink = `https://mrben.com/?btag=${code}_refer`
  const copy = () => navigator.clipboard?.writeText(refLink).then(() => app.showToast('Referral link copied')).catch(() => app.showToast('Copy failed'))

  return (
    <main className="affil-page">
      <div className="wrap">
        <div className="affil-crumb"><button onClick={() => app.goLobby()}>Home</button><span>/</span><b>Affiliate Program</b></div>

        {/* Hero */}
        <section className="affil-hero">
          <div className="affil-hero-txt">
            <span className="affil-kicker">MrBen Partners</span>
            <h1>Earn with the house that pays.</h1>
            <p>Send us players and earn a share of the action, month after month. Up to 40% revenue share, up to €50 CPA, and reliable Net 30 payments. Real-time stats, fresh creatives, and a dedicated manager.</p>
            <div className="affil-cta">
              <a className="btn orange" href={`${AFFILIATE_APP}/?apply=1`} target="_blank" rel="noopener">Apply to join</a>
              <a className="btn sec" href={AFFILIATE_APP} target="_blank" rel="noopener">Affiliate login</a>
            </div>
          </div>
          <div className="affil-hero-stats">
            <div><b>40%</b><span>RevShare</span></div>
            <div><b>€50</b><span>CPA</span></div>
            <div><b>Net 30</b><span>Payments</span></div>
          </div>
        </section>

        {/* Refer a friend */}
        <section className="affil-refer">
          <h2>Refer a friend</h2>
          {user ? (
            <>
              <p>Share your personal link. When a friend signs up and deposits, you both get rewarded.</p>
              <div className="affil-reflink">
                <input readOnly value={refLink} onFocus={e => e.currentTarget.select()} />
                <button className="btn orange" onClick={copy}>Copy link</button>
              </div>
              <div className="affil-refcode">Your code: <b>{code}</b></div>
            </>
          ) : (
            <>
              <p>Sign in to get your personal referral link and start earning when friends join.</p>
              <button className="btn orange" onClick={() => app.setAuthModal('login')}>Sign in to get my link</button>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="affil-how">
          <h2>How it works</h2>
          <div className="affil-steps">
            {[
              ['1', 'Apply', 'Tell us about your traffic. Approval is usually within 48 hours.'],
              ['2', 'Promote', 'Grab your tracking links and creatives from the affiliate dashboard.'],
              ['3', 'Get paid', 'Track clicks, sign-ups and revenue in real time, and get paid every month.'],
            ].map(([n, t, d]) => (
              <div key={n} className="affil-step"><span className="affil-step-n">{n}</span><b>{t}</b><p>{d}</p></div>
            ))}
          </div>
        </section>

        {/* Deals */}
        <section className="affil-deals">
          <h2>Commission plans</h2>
          <div className="affil-deal-grid">
            {[
              ['Revenue Share', 'Up to 40%', 'A share of your players’ net revenue for their lifetime. Tiered on performance.'],
              ['CPA', 'Up to €50', 'A fixed amount for every new depositing player you send.'],
              ['Hybrid', '€25 + 20%', 'A CPA up front plus ongoing revenue share. Best of both.'],
            ].map(([t, v, d]) => (
              <div key={t} className="affil-deal"><span className="affil-deal-v">{v}</span><b>{t}</b><p>{d}</p></div>
            ))}
          </div>
          <p className="affil-fine">18+. Commercial terms are agreed per affiliate. No incentivised or brand-bidding traffic. Play and promote responsibly.</p>
        </section>

        <div className="affil-back"><button className="btn ghost" onClick={() => app.goLobby()}>← Back to casino</button></div>
      </div>
    </main>
  )
}
