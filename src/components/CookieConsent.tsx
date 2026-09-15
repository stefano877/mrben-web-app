import { useState } from 'react'
import { useApp } from '../store'
import { loadMarketingTags } from '../marketing'

const KEY = 'mrben.cookie.v1'

export default function CookieConsent() {
  const app = useApp()
  const [done, setDone] = useState(() => { try { return !!localStorage.getItem(KEY) } catch { return false } })
  if (done) return null

  const choose = (v: 'all' | 'essential') => {
    try { localStorage.setItem(KEY, v) } catch { /* ignore */ }
    setDone(true)
    if (v === 'all') loadMarketingTags()  // arm analytics/marketing tags only on full consent (MRB-96)
    app.showToast(v === 'all' ? app.t('cookie.toastAll', 'All cookies accepted') : app.t('cookie.toastEssential', 'Essential cookies only'))
  }

  return (
    <div className="cookiebar" role="dialog" aria-label={app.t('cookie.aria', 'Cookie consent')}>
      <div className="cookiebar-in">
        <div className="cookiebar-txt">
          {app.t('cookie.body', 'We use essential cookies to run MrBen and, with your consent, analytics and marketing cookies to improve it and show relevant offers. Read our ')}<a onClick={() => app.openModal({ type: 'info', key: 'cookies' })}>{app.t('cookie.policy', 'cookie policy')}</a>.
        </div>
        <div className="cookiebar-btns">
          <button className="ck-sec" onClick={() => choose('essential')}>{app.t('cookie.essential', 'Essential only')}</button>
          <button className="ck-pri" onClick={() => choose('all')}>{app.t('cookie.acceptAll', 'Accept all')}</button>
        </div>
      </div>
    </div>
  )
}
