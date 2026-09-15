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
  const copy = () => navigator.clipboard?.writeText(refLink).then(() => app.showToast(app.t('aff.copied', 'Referral link copied'))).catch(() => app.showToast(app.t('aff.copyFailed', 'Copy failed')))

  // [react key, title key, title fallback, desc key, desc fallback]
  const steps: [string, string, string, string, string][] = [
    ['1', 'aff.step1t', 'Apply', 'aff.step1d', 'Tell us about your traffic. Approval is usually within 48 hours.'],
    ['2', 'aff.step2t', 'Promote', 'aff.step2d', 'Grab your tracking links and creatives from the affiliate dashboard.'],
    ['3', 'aff.step3t', 'Get paid', 'aff.step3d', 'Track clicks, sign-ups and revenue in real time, and get paid every month.'],
  ]
  // [react key, title key, title fallback, value, desc key, desc fallback]
  const deals: [string, string, string, string, string, string][] = [
    ['rev', 'aff.deal1t', 'Revenue Share', app.t('aff.deal1v', 'Up to 40%'), 'aff.deal1d', 'A share of your players’ net revenue for their lifetime. Tiered on performance.'],
    ['cpa', 'aff.deal2t', 'CPA', app.t('aff.deal2v', 'Up to €50'), 'aff.deal2d', 'A fixed amount for every new depositing player you send.'],
    ['hybrid', 'aff.deal3t', 'Hybrid', '€25 + 20%', 'aff.deal3d', 'A CPA up front plus ongoing revenue share. Best of both.'],
  ]

  return (
    <main className="affil-page">
      <div className="wrap">
        <div className="affil-crumb"><button onClick={() => app.goLobby()}>{app.t('aff.home', 'Home')}</button><span>/</span><b>{app.t('menu.affiliate', 'Affiliate Program')}</b></div>

        {/* Hero */}
        <section className="affil-hero">
          <div className="affil-hero-txt">
            <span className="affil-kicker">{app.t('aff.kicker', 'MrBen Partners')}</span>
            <h1>{app.t('aff.h1', 'Earn with the house that pays.')}</h1>
            <p>{app.t('aff.heroP', 'Send us players and earn a share of the action, month after month. Up to 40% revenue share, up to €50 CPA, and reliable Net 30 payments. Real-time stats, fresh creatives, and a dedicated manager.')}</p>
            <div className="affil-cta">
              <a className="btn orange" href={`${AFFILIATE_APP}/?apply=1`} target="_blank" rel="noopener">{app.t('aff.apply', 'Apply to join')}</a>
              <a className="btn sec" href={AFFILIATE_APP} target="_blank" rel="noopener">{app.t('aff.login', 'Affiliate login')}</a>
            </div>
          </div>
          <div className="affil-hero-stats">
            <div><b>40%</b><span>{app.t('aff.revshare', 'RevShare')}</span></div>
            <div><b>€50</b><span>CPA</span></div>
            <div><b>Net 30</b><span>{app.t('aff.payments', 'Payments')}</span></div>
          </div>
        </section>

        {/* Refer a friend */}
        <section className="affil-refer">
          <h2>{app.t('aff.refer', 'Refer a friend')}</h2>
          {user ? (
            <>
              <p>{app.t('aff.referP', 'Share your personal link. When a friend signs up and deposits, you both get rewarded.')}</p>
              <div className="affil-reflink">
                <input readOnly value={refLink} onFocus={e => e.currentTarget.select()} />
                <button className="btn orange" onClick={copy}>{app.t('aff.copyLink', 'Copy link')}</button>
              </div>
              <div className="affil-refcode">{app.t('aff.yourCode', 'Your code:')} <b>{code}</b></div>
            </>
          ) : (
            <>
              <p>{app.t('aff.referSignedOut', 'Sign in to get your personal referral link and start earning when friends join.')}</p>
              <button className="btn orange" onClick={() => app.setAuthModal('login')}>{app.t('aff.signInLink', 'Sign in to get my link')}</button>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="affil-how">
          <h2>{app.t('aff.how', 'How it works')}</h2>
          <div className="affil-steps">
            {steps.map(([n, tk, tf, dk, df]) => (
              <div key={n} className="affil-step"><span className="affil-step-n">{n}</span><b>{app.t(tk, tf)}</b><p>{app.t(dk, df)}</p></div>
            ))}
          </div>
        </section>

        {/* Deals */}
        <section className="affil-deals">
          <h2>{app.t('aff.plans', 'Commission plans')}</h2>
          <div className="affil-deal-grid">
            {deals.map(([k, tk, tf, v, dk, df]) => (
              <div key={k} className="affil-deal"><span className="affil-deal-v">{v}</span><b>{app.t(tk, tf)}</b><p>{app.t(dk, df)}</p></div>
            ))}
          </div>
          <p className="affil-fine">{app.t('aff.fine', '18+. Commercial terms are agreed per affiliate. No incentivised or brand-bidding traffic. Play and promote responsibly.')}</p>
        </section>

        <div className="affil-back"><button className="btn ghost" onClick={() => app.goLobby()}>{app.t('aff.back', '← Back to casino')}</button></div>
      </div>
    </main>
  )
}
