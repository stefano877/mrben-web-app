// Public-facing legal and information content shown in the footer modals.
// These are player-friendly versions of the full policy drafts. Company,
// licence and contact specifics are shown as provisional until incorporation
// and the licence are finalised. Reviewed-by-counsel copy replaces this before
// real-money launch.

export interface LegalDoc { title: string; html: string }

export const LEGAL: Record<string, LegalDoc> = {
  about: {
    title: 'About Us',
    html: `<p>MrBen is a bonus-heavy, mobile-first online casino from <b>Mr iGaming Group</b>, built around Ben, your host. Our mission is simple: thousands of great games, crypto-fast payouts, and a brand that actually looks after its players.</p>
    <p>We offer slots, live casino and table games from leading studios, wrapped in a generous welcome package and a loyalty programme that rewards every spin.</p>
    <p>MrBen operates under an Anjouan Gaming Licence (Union of the Comoros) and serves players worldwide, excluding restricted territories. Full company details appear here once incorporation is complete.</p>`,
  },

  terms: {
    title: 'Terms and Conditions',
    html: `<p><b>Operator.</b> MrBen is operated by Mr iGaming Group, licensed and regulated under the Anjouan Gaming Licence (Union of the Comoros). The licensed entity, registration number and licence number are displayed once finalised.</p>
    <h4>1. Acceptance</h4>
    <p>By registering or using MrBen you agree to these Terms, our Privacy Policy, Cookie Policy, Bonus Terms, Responsible Gambling Policy and any game or promotion rules. If you do not agree, do not use the service. We may amend these Terms and will notify you of material changes; continued use means acceptance.</p>
    <h4>2. Eligibility</h4>
    <p>You must be at least <b>18</b> and legally allowed to gamble where you are. The service is not available in restricted territories, and not to self-excluded persons or our staff and their close relatives. One account per person, household, device, IP and payment instrument.</p>
    <h4>3. Your account</h4>
    <p>Register with true, current information and keep it up to date. You are responsible for keeping your login secure and for all activity on your account. Your account is personal and non-transferable. We may run verification checks at any time and may restrict functionality, including withdrawals, until they are complete.</p>
    <h4>4. Deposits and funds</h4>
    <p>Deposit only from a payment method in your own name. Minimums, maximums and fees are shown in the cashier. We do not provide credit and balances do not earn interest. We operate anti-money-laundering controls and may request source-of-funds information.</p>
    <h4>5. Bets, games and results</h4>
    <p>A bet is accepted only when confirmed by our servers; our records are authoritative. Outcomes are determined by certified random number generators or the live-game provider. If a game malfunctions or an obvious error occurs, affected bets and pays may be voided. You must not use devices, software, bots or bugs to gain an unfair advantage, or collude, or exploit an error.</p>
    <h4>6. Withdrawals</h4>
    <p>You may withdraw available funds subject to identity verification and any wagering requirements on bonus funds. Your first withdrawal requires completed KYC and is paid to a verified method in your name. Large or unusual withdrawals may need additional checks.</p>
    <h4>7. Verification, KYC and AML</h4>
    <p>To meet our licence and anti-money-laundering duties we verify identity, age, address and, where required, source of funds. You agree to provide the documents we reasonably request. We may suspend wagering or withdrawals while checks are pending.</p>
    <h4>8. Bonuses</h4>
    <p>Bonuses are optional and subject to the Bonus Terms and each promotion's rules, including wagering requirements, eligible games, maximum bet, conversion caps and expiry. Abuse voids the bonus and related winnings.</p>
    <h4>9. Responsible gambling</h4>
    <p>You can set deposit, loss and session limits, request reality checks, take a time-out or self-exclude at any time. Limit decreases apply promptly; increases apply after a cooling-off period. Self-exclusion cannot be lifted early.</p>
    <h4>10. Prohibited conduct</h4>
    <p>You must not use the service for money laundering, fraud or any unlawful purpose, use another person's identity or payment method, interfere with the service, or behave abusively toward our staff or other players.</p>
    <h4>11. Suspension and closure</h4>
    <p>We may suspend or close an account, void bets and withhold funds where we reasonably believe these Terms are breached or where required by law or our licence. You may close your account at any time; we return available, verified funds subject to these Terms.</p>
    <h4>12. Complaints</h4>
    <p>Contact Support with any complaint. If we cannot resolve it, you may escalate to our independent dispute-resolution provider, named alongside our licence. Where your records differ from our server records, the server records prevail.</p>
    <h4>13. Liability</h4>
    <p>The service is provided "as is". To the fullest extent permitted by law we exclude implied warranties and are not liable for indirect loss or losses arising from your gambling or from events beyond our control. Nothing limits liability that cannot be limited by law.</p>
    <h4>14. General</h4>
    <p>These Terms are governed by the applicable law of our licence and jurisdiction. If any provision is invalid, the rest stands. The English version prevails over translations.</p>
    <p class="muted-sm">18+ · Play responsibly · MrBen operates under an Anjouan Gaming Licence.</p>`,
  },

  privacy: {
    title: 'Privacy Policy',
    html: `<p><b>Controller.</b> Mr iGaming Group, operator of MrBen. Privacy contact: <b>privacy@mrben.com</b>.</p>
    <h4>What we collect</h4>
    <p>Information you provide (name, date of birth, email, phone, address, country, username and password; identity and address documents and source-of-funds information for verification); payment and transaction data; gameplay, balances, bonuses and responsible-gambling settings; technical data such as IP address, approximate location and device information; and data from verification, anti-money-laundering, fraud and affiliate providers. Full card numbers are handled by PCI-DSS-compliant payment providers, not stored by us.</p>
    <h4>Why we use it</h4>
    <p>To create and run your account, verify age and identity, prevent underage gambling, meet anti-money-laundering and fraud-prevention duties, monitor for gambling harm, process payments, provide support, secure and improve the service, and, with your consent, send marketing. Some processing is required by law or our licence.</p>
    <h4>Marketing</h4>
    <p>If you opt in, we may contact you with offers by email, SMS, push or on-site messages. You can opt out at any time from your account or the unsubscribe link. We do not sell your data, and we never send promotional messages to self-excluded players or players on a break.</p>
    <h4>Sharing</h4>
    <p>We share data with payment, verification, anti-money-laundering, fraud, hosting, messaging and analytics providers acting on our instructions, with the gaming platform and game suppliers needed to run games, and with regulators, auditors and law enforcement where required.</p>
    <h4>Retention and security</h4>
    <p>We keep data only as long as necessary and to meet legal and licensing obligations; account, transaction and verification records are typically kept for at least five years after closure. Data is protected with encryption in transit and access controls.</p>
    <h4>Your rights</h4>
    <p>Subject to law, you can access, correct, delete or restrict your data, object to processing, request portability and withdraw marketing consent. Some rights are limited where we must retain records (for example, we cannot delete records required for anti-money-laundering, and cannot remove a self-exclusion before it expires). Contact <b>privacy@mrben.com</b>.</p>
    <h4>Children</h4>
    <p>The service is strictly for adults (18+). We do not knowingly process minors' data.</p>`,
  },

  'rg-policy': {
    title: 'Responsible Gambling',
    html: `<p>Gambling should always be fun, never a way to make money or escape problems. MrBen gives you the tools to stay in control.</p>
    <h4>Tools you control</h4>
    <ul>
      <li><b>Deposit, loss and session limits</b> — daily, weekly or monthly. Decreases apply promptly; increases only after a cooling-off period.</li>
      <li><b>Reality checks</b> — periodic reminders of how long you have played and your net position.</li>
      <li><b>Time-out (cool-off)</b> — a short break during which you cannot deposit or play.</li>
      <li><b>Self-exclusion</b> — from six months up to permanent. It cannot be reversed early.</li>
    </ul>
    <p>Set all of these from your account, or contact <b>support@mrben.com</b>.</p>
    <h4>Checking yourself</h4>
    <p>Do you gamble more than you can afford, chase losses, gamble to escape stress, or have others expressed concern? If so, please use our tools and seek support.</p>
    <h4>Protecting minors</h4>
    <p>Gambling by anyone under 18 is illegal and prohibited. Keep your login private and use family-filtering software if you share a device.</p>
    <h4>Getting help</h4>
    <p>Free, confidential support is available through organisations such as GamCare, GambleAware and Gamblers Anonymous, and national helplines in your country. You can also self-exclude with us at any time.</p>`,
  },

  'self-exclusion': {
    title: 'Self-Exclusion',
    html: `<p>Self-exclusion lets you close off your access to gambling with MrBen for a set period when you feel you need to stop.</p>
    <h4>How to self-exclude</h4>
    <p>Self-exclude at any time from your account's Responsible Gambling settings, or by contacting <b>support@mrben.com</b>. Choose a period from six months up to permanent.</p>
    <h4>What happens</h4>
    <ul>
      <li>Your account is closed to gambling immediately; you cannot deposit or bet.</li>
      <li>We remove you from marketing and stop promotional messages.</li>
      <li>We return your available, verified balance by an appropriate method.</li>
      <li>Active bonuses are forfeited.</li>
      <li>We take reasonable steps to prevent you opening a new account during the exclusion.</li>
    </ul>
    <h4>It cannot be undone early</h4>
    <p>A self-exclusion cannot be lifted before it ends. When it ends, your account is not reactivated automatically: you must contact us to confirm you wish to return, after which a short cooling-off period applies.</p>
    <p>If you want a shorter break, take a <b>time-out</b> instead. Free support is available — see our Responsible Gambling page.</p>`,
  },

  'promo-terms': {
    title: 'Promotional Terms and Conditions',
    html: `<p>These terms apply to all MrBen bonuses, free spins and promotions, alongside each offer's specific rules, which prevail where they differ.</p>
    <h4>General</h4>
    <p>Bonuses are optional and available only to eligible, verified players aged 18+, one per person, household, device and IP unless stated. Promotions are not available to self-excluded players or players on a break. We may vary or withdraw a promotion; accrued rights on bonuses already granted are honoured.</p>
    <h4>Wagering</h4>
    <p>Bonus funds and free-spin winnings must be wagered a set number of times before withdrawal. For example, a bonus with 35x wagering on a €50 bonus needs €1,750 of eligible wagers. Games contribute at different rates — typically slots 100%, with lower or nil contribution for live casino and table games. A maximum bet applies while a wagering requirement is active; exceeding it may void the bonus and related winnings.</p>
    <h4>Caps and expiry</h4>
    <p>A maximum conversion to withdrawable cash may apply. Bonuses and unused free spins expire after the stated period; on expiry the bonus and winnings still subject to wagering are removed. Real-money balance is used before bonus balance unless stated.</p>
    <h4>Fair use</h4>
    <p>Bonuses are for genuine entertainment play. Opening multiple accounts, bonus arbitrage, equal or low-risk betting only to clear wagering, collusion, or exploiting an offer against its spirit may forfeit the bonus and winnings and lead to account closure. We may verify before crediting or paying out a bonus.</p>`,
  },

  cookies: {
    title: 'Cookie Settings',
    html: `<p>Cookies and similar technologies help us run MrBen, keep you signed in, keep the platform secure and, with your consent, measure performance and personalise offers.</p>
    <h4>Categories</h4>
    <ul>
      <li><b>Strictly necessary</b> (always on) — session and login, security and fraud prevention, and responsible-gambling and self-exclusion enforcement. The site cannot function without these.</li>
      <li><b>Functional</b> (consent) — remembering preferences such as language and display.</li>
      <li><b>Analytics</b> (consent) — understanding how the site is used so we can improve it.</li>
      <li><b>Marketing</b> (consent) — measuring campaigns and personalising offers.</li>
    </ul>
    <p>You can change your choice at any time from this panel. Blocking strictly necessary cookies will break core features such as login and responsible-gambling controls.</p>`,
  },

  support: {
    title: 'Support',
    html: `<p>Need a hand? Our team is here around the clock.</p>
    <p><b>support@mrben.com</b><br>Live chat (coming soon)</p>
    <p>We help with your account, deposits and withdrawals, bonuses, games and responsible gambling. For account security we may ask you to verify your identity.</p>`,
  },

  contact: {
    title: 'Contact Us',
    html: `<p>Get in touch any time.</p>
    <p><b>support@mrben.com</b><br>Mr iGaming Group (registered office shown once finalised)</p>
    <p>For complaints, please see our Complaints and procedures page first.</p>`,
  },

  'betting-rules': {
    title: 'Game Rules',
    html: `<p>Casino game outcomes are determined by certified random number generators or, for live games, by the licensed live-game provider. Return-to-player figures, where shown, are theoretical and calculated over long-run play.</p>
    <p>If a game malfunctions or a bet is accepted in error, affected bets and pays may be voided and balances corrected ("malfunction voids all pays and plays"). Maximum payout limits may apply. Full rules for each game are available in the game.</p>`,
  },

  complaints: {
    title: 'Complaints and Procedures',
    html: `<p>We aim to resolve every issue quickly and fairly. Please contact Support first with your account details and a description of the problem. We aim to acknowledge promptly and keep you updated.</p>
    <p>If your complaint is not resolved, you may escalate it to our independent dispute-resolution provider, named alongside our Anjouan licence. Where your records differ from our server records, the server records prevail.</p>`,
  },
}
