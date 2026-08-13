import type { Game } from './data'
import { WHEEL } from './data'

let ARTI = 0
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function motifOf(name: string): string {
  const n = name.toLowerCase()
  if (/dice/.test(n)) return 'dice'
  if (/roulette|wheel|crazy|monopoly/.test(n)) return 'wheel'
  if (/blackjack|baccarat|poker|hold/.test(n)) return 'cards'
  if (/gold|bars|bullion|cash|vault|rush/.test(n)) return 'bars'
  if (/diamond|gem|starburst|neon|crystal|mystic/.test(n)) return 'gem'
  if (/rocket|crash|blaster|reactoon|comet/.test(n)) return 'rocket'
  if (/olympus|gates|zeus|thunder|light|storm/.test(n)) return 'bolt'
  if (/pirate|bounty|dragon|hoard|chest|book|wolf|buffalo|safari|frog|bass|fish|train/.test(n)) return 'chest'
  if (/candy|sugar|sweet|fruit|fiesta|bonanza|star|lucky|fortune/.test(n)) return 'star'
  return 'coin'
}

const MBG: Record<string, [string, string]> = {
  coin: ['#F6B93B', '#7A3E05'], bars: ['#F6B93B', '#6E3A05'], dice: ['#FF7A3D', '#B01E00'],
  wheel: ['#14C0A6', '#0A3B37'], cards: ['#1FB574', '#0A3A28'], gem: ['#38C6FF', '#0B3A8C'],
  rocket: ['#8A6BFF', '#2A1466'], bolt: ['#3E7BFF', '#141C6B'], chest: ['#B24CE0', '#3D1268'], star: ['#FF5EA0', '#7A1E5A'],
}

function starP(cx: number, cy: number, ro: number, ri: number): string {
  let p = ''
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? ri : ro
    const a = ((-90 + k * 36) * Math.PI) / 180
    p += (k ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1) + ' '
  }
  return p + 'Z'
}
function penta(cx: number, cy: number, r: number): string {
  let p = ''
  for (let k = 0; k < 5; k++) {
    const a = ((-90 + k * 72) * Math.PI) / 180
    p += (k ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1) + ' '
  }
  return p + 'Z'
}
function checker(x: number, y: number, w: number, h: number): string {
  let s = ''
  const cw = w / 6, ch = h / 4
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) if ((r + c) % 2 === 0)
    s += `<rect x="${(x + c * cw).toFixed(1)}" y="${(y + r * ch).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="#12203c"/>`
  return s
}

const MOT: Record<string, (i: number, ch: string) => string> = {
  coin: (i, ch) => `<ellipse cx="100" cy="150" rx="44" ry="10" fill="#000" opacity=".28"/><circle cx="100" cy="102" r="46" fill="url(#au${i})"/><circle cx="100" cy="102" r="46" fill="none" stroke="#FFF3C8" stroke-width="3"/><circle cx="100" cy="102" r="36" fill="none" stroke="#8A5E12" stroke-width="3" opacity=".5"/><path d="M72 82 A46 46 0 0 1 128 74" fill="none" stroke="#FFFDF2" stroke-width="4" stroke-linecap="round" opacity=".6"/><text x="100" y="118" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#6B4406">${ch}</text>`,
  bars: (i) => `<ellipse cx="100" cy="152" rx="50" ry="10" fill="#000" opacity=".26"/><g stroke="#FFF3C8" stroke-width="1.5"><polygon points="66,124 134,124 126,146 74,146" fill="url(#au${i})"/><polygon points="58,98 106,98 98,120 50,120" fill="url(#au${i})"/><polygon points="96,98 146,98 152,120 104,120" fill="url(#au${i})"/></g><path d="M70 126 h56" stroke="#fff8dc" stroke-width="2" opacity=".5"/>`,
  dice: () => `<ellipse cx="100" cy="152" rx="48" ry="10" fill="#000" opacity=".26"/><g transform="translate(76,96) rotate(-12)"><rect x="-27" y="-27" width="54" height="54" rx="13" fill="#fff"/><circle cx="-13" cy="-13" r="5" fill="#E23B3B"/><circle cx="0" cy="0" r="5" fill="#E23B3B"/><circle cx="13" cy="13" r="5" fill="#E23B3B"/></g><g transform="translate(124,112) rotate(14)"><rect x="-24" y="-24" width="48" height="48" rx="11" fill="#fff"/><circle cx="-11" cy="-11" r="4.5" fill="#222"/><circle cx="11" cy="-11" r="4.5" fill="#222"/><circle cx="-11" cy="11" r="4.5" fill="#222"/><circle cx="11" cy="11" r="4.5" fill="#222"/></g>`,
  gem: () => `<ellipse cx="100" cy="150" rx="34" ry="9" fill="#000" opacity=".25"/><polygon points="100,56 140,90 100,152 60,90" fill="#8EE9FF"/><polygon points="100,56 140,90 100,100 60,90" fill="#D6F7FF"/><polygon points="60,90 100,100 100,152" fill="#4FC3F7"/><polygon points="140,90 100,100 100,152" fill="#1E9BE0"/><polygon points="100,56 100,100 60,90" fill="#B3F0FF" opacity=".85"/><path d="M74 82 l14 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
  rocket: (i) => `<g transform="translate(100,104) rotate(-18)"><path d="M0,-48 C17,-31 17,6 7,28 L-7,28 C-17,6 -17,-31 0,-48 Z" fill="url(#st${i})" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="-14" r="8" fill="#0C1730" stroke="#fff" stroke-width="1.5"/><path d="M-7,22 L-22,36 L-7,31 Z" fill="#E23B3B"/><path d="M7,22 L22,36 L7,31 Z" fill="#E23B3B"/><path d="M-7,30 C-3,48 3,48 7,30 C4,58 -4,58 -7,30 Z" fill="#FFC24B"/></g><circle cx="150" cy="60" r="2.5" fill="#fff"/><circle cx="56" cy="72" r="2" fill="#fff"/><circle cx="142" cy="124" r="2" fill="#fff"/>`,
  bolt: (i) => `<path d="M110,54 L76,116 L98,116 L84,160 L130,92 L106,92 Z" fill="url(#au${i})" stroke="#FFF6D0" stroke-width="2.5" stroke-linejoin="round"/><circle cx="150" cy="70" r="2" fill="#fff"/><circle cx="58" cy="86" r="2" fill="#fff"/>`,
  wheel: (i) => {
    let segs = ''
    for (let k = 0; k < 12; k++) {
      const a0 = (k * 30 * Math.PI) / 180, a1 = ((k + 1) * 30 * Math.PI) / 180, ri = 18, ro = 42, cx = 100, cy = 102
      const x0 = cx + ro * Math.cos(a0), y0 = cy + ro * Math.sin(a0), x1 = cx + ro * Math.cos(a1), y1 = cy + ro * Math.sin(a1)
      const x2 = cx + ri * Math.cos(a1), y2 = cy + ri * Math.sin(a1), x3 = cx + ri * Math.cos(a0), y3 = cy + ri * Math.sin(a0)
      segs += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${ro} ${ro} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} A${ri} ${ri} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z" fill="${k % 2 ? '#C0392B' : '#15181f'}"/>`
    }
    return `<ellipse cx="100" cy="152" rx="42" ry="9" fill="#000" opacity=".26"/><circle cx="100" cy="102" r="47" fill="#0d1a2e"/>${segs}<circle cx="100" cy="102" r="47" fill="none" stroke="url(#au${i})" stroke-width="6"/><circle cx="100" cy="102" r="17" fill="url(#au${i})" stroke="#7a5312" stroke-width="1.5"/><circle cx="100" cy="102" r="4" fill="#3a2a06"/>`
  },
  chest: (i) => `<ellipse cx="100" cy="154" rx="48" ry="10" fill="#000" opacity=".26"/><rect x="60" y="106" width="80" height="44" rx="6" fill="#6B3A17"/><path d="M60,106 a40,26 0 0 1 80,0 Z" fill="#7A4420"/><rect x="60" y="118" width="80" height="7" fill="url(#au${i})"/><rect x="92" y="116" width="16" height="24" rx="2" fill="url(#au${i})"/><circle cx="100" cy="128" r="3.5" fill="#3a2a06"/><g fill="url(#au${i})"><circle cx="80" cy="100" r="4"/><circle cx="100" cy="95" r="5"/><circle cx="120" cy="100" r="4"/></g>`,
  cards: () => `<ellipse cx="100" cy="152" rx="40" ry="9" fill="#000" opacity=".25"/><g transform="translate(86,106) rotate(-10)"><rect x="-27" y="-36" width="54" height="74" rx="8" fill="#fff"/><text x="-19" y="-16" font-family="Georgia,serif" font-size="18" font-weight="800" fill="#E23B3B">A</text><path d="M0 2 C-6 -6 -14 2 0 12 C14 2 6 -6 0 2 Z" transform="translate(4,4)" fill="#E23B3B"/></g><g transform="translate(114,102) rotate(11)"><rect x="-27" y="-36" width="54" height="74" rx="8" fill="#fff"/><text x="-19" y="-16" font-family="Georgia,serif" font-size="18" font-weight="800" fill="#1B1D33">K</text><path d="M0 2 C-6 -6 -14 2 0 12 C14 2 6 -6 0 2 Z" transform="translate(4,4)" fill="#1B1D33"/></g>`,
  star: (i) => `<path d="${starP(100, 104, 44, 20)}" fill="url(#au${i})" stroke="#FFF3C8" stroke-width="2"/><path d="${starP(100, 104, 26, 12)}" fill="#FFF0B8" opacity=".55"/><circle cx="150" cy="66" r="3" fill="#fff"/><circle cx="58" cy="78" r="2.5" fill="#fff"/><circle cx="140" cy="130" r="2.5" fill="#fff"/>`,
}

const fitFont = (len: number) => Math.max(13, Math.min(23, Math.floor(176 / (0.6 * Math.max(1, len)))))

export function genCover(g: Game): string {
  const i = ARTI++
  const key = motifOf(g.name)
  const bg = MBG[key] || ['#333', '#111']
  const chMatch = g.name.match(/[A-Za-z0-9]/)
  const ch = (chMatch ? chMatch[0] : 'M').toUpperCase()
  const words = g.name.toUpperCase().split(' ')
  let l1 = g.name.toUpperCase(), l2 = ''
  if (words.length > 1) {
    if (words[0].length <= 3) { l1 = words.slice(0, 2).join(' '); l2 = words.slice(2).join(' ') }
    else { l1 = words[0]; l2 = words.slice(1).join(' ') }
  }
  const fs = fitFont(Math.max(l1.length, l2.length))
  const y1 = l2 ? 198 : 210, y2 = y1 + fs + 1, py = (l2 ? y2 : y1) + 16
  const tstyle = `font-family="'Poppins',sans-serif" font-weight="800" text-anchor="middle" fill="#fff" paint-order="stroke" stroke="rgba(0,0,0,.4)" stroke-width="0.7"`
  const title = `<text x="100" y="${y1}" font-size="${fs}" ${tstyle}>${esc(l1)}</text>` + (l2 ? `<text x="100" y="${y2}" font-size="${fs}" ${tstyle}>${esc(l2)}</text>` : '')
  const prov = `<text x="100" y="${py}" text-anchor="middle" font-family="'Poppins',sans-serif" font-weight="700" font-size="9" letter-spacing="2" fill="#fff" opacity=".72">${esc(g.studio.toUpperCase())}</text>`
  return `<svg class="cover" viewBox="0 0 200 264" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="bg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
      <radialGradient id="sp${i}" cx="0.5" cy="0.4" r="0.62"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="au${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".5" stop-color="#F4C24B"/><stop offset="1" stop-color="#B9821A"/></linearGradient>
      <linearGradient id="st${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF2FF"/><stop offset="1" stop-color="#9DB4D8"/></linearGradient>
      <linearGradient id="scr${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060c" stop-opacity="0"/><stop offset=".55" stop-color="#05060c" stop-opacity=".66"/><stop offset="1" stop-color="#05060c" stop-opacity=".9"/></linearGradient>
    </defs>
    <rect width="200" height="264" fill="url(#bg${i})"/>
    <ellipse cx="100" cy="104" rx="118" ry="94" fill="url(#sp${i})"/>
    ${MOT[key](i, ch)}
    <rect x="0" y="150" width="200" height="114" fill="url(#scr${i})"/>
    ${title}${prov}
  </svg>`
}

export function promoArt(key: string): string {
  if (key === 'sports') return `<svg class="pa" viewBox="0 0 200 200"><ellipse cx="132" cy="178" rx="52" ry="12" fill="#000" opacity=".22"/><g class="speed" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"><line x1="72" y1="98" x2="30" y2="98"/><line x1="78" y1="118" x2="40" y2="118"/><line x1="74" y1="138" x2="44" y2="138"/></g><g class="roll"><circle cx="132" cy="118" r="46" fill="#fff"/><path d="${penta(132, 118, 15)}" fill="#12203c"/><g fill="#12203c"><path d="${penta(132, 76, 7)}"/><path d="${penta(174, 110, 7)}"/><path d="${penta(158, 162, 7)}"/><path d="${penta(106, 162, 7)}"/><path d="${penta(90, 110, 7)}"/></g><circle cx="132" cy="118" r="46" fill="none" stroke="#c9d4e6" stroke-width="2"/></g></svg>`
  if (key === 'trophy') return `<svg class="pa" viewBox="0 0 200 200"><g class="conf"><rect x="72" y="40" width="7" height="11" rx="2" fill="#FF5EA0"/><rect x="150" y="34" width="7" height="11" rx="2" fill="#5EE6A8"/><rect x="120" y="46" width="7" height="11" rx="2" fill="#FFC24B"/><rect x="96" y="38" width="7" height="11" rx="2" fill="#5EA8FF"/></g><g class="bob1"><path d="M104 92 h56 v9 a28 28 0 0 1 -56 0 Z" fill="#F4C24B" stroke="#FFF3C8" stroke-width="2"/><path d="M104 96 a13 13 0 0 1 0 -26" fill="none" stroke="#F4C24B" stroke-width="6"/><path d="M160 96 a13 13 0 0 0 0 -26" fill="none" stroke="#F4C24B" stroke-width="6"/><rect x="126" y="128" width="12" height="14" fill="#C88A1E"/><rect x="112" y="142" width="40" height="9" rx="3" fill="#F4C24B"/><text x="132" y="112" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="800" fill="#7a5312">1</text></g></svg>`
  if (key === 'flag') return `<svg class="pa" viewBox="0 0 200 200"><g class="speed" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"><line x1="66" y1="150" x2="26" y2="150"/><line x1="76" y1="166" x2="36" y2="166"/></g><rect x="96" y="66" width="5" height="100" rx="2" fill="#d7dce6"/><g class="flag"><rect x="101" y="66" width="72" height="48" fill="#fff"/>${checker(101, 66, 72, 48)}</g></svg>`
  if (key === 'coin') return `<svg class="pa" viewBox="0 0 200 200"><ellipse cx="128" cy="170" rx="52" ry="12" fill="#000" opacity=".2"/><g class="spin"><circle cx="128" cy="110" r="50" fill="#F4C24B" stroke="#FFF3C8" stroke-width="4"/><circle cx="128" cy="110" r="38" fill="none" stroke="#a97e1e" stroke-width="4" opacity=".5"/><text x="128" y="127" text-anchor="middle" font-family="Georgia,serif" font-size="50" font-weight="800" fill="#6B4406">$</text></g><g class="spark" fill="#fff"><circle cx="66" cy="66" r="3"/><circle cx="188" cy="92" r="2.5"/><circle cx="92" cy="54" r="2"/></g></svg>`
  // default casino
  return `<svg class="pa" viewBox="0 0 200 200"><ellipse cx="132" cy="178" rx="56" ry="13" fill="#000" opacity=".22"/><g class="bob1"><circle cx="176" cy="150" r="22" fill="#3AA0FF" stroke="#fff" stroke-width="3"/><circle cx="176" cy="150" r="14" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/></g><g class="bob2" transform="translate(92,120) rotate(-16)"><rect x="-20" y="-28" width="40" height="56" rx="6" fill="#fff"/><text x="0" y="7" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="800" fill="#E23B3B">A</text></g><g class="spin"><circle cx="132" cy="116" r="36" fill="#F4C24B" stroke="#FFF3C8" stroke-width="3"/><circle cx="132" cy="116" r="26" fill="none" stroke="#a97e1e" stroke-width="3" opacity=".55"/><text x="132" y="129" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-weight="800" fill="#6B4406">$</text></g><g class="spark" fill="#fff"><circle cx="70" cy="70" r="3"/><circle cx="182" cy="96" r="2.5"/><circle cx="98" cy="58" r="2"/></g></svg>`
}

export function chestSVG(): string {
  return `<svg viewBox="0 0 64 64"><rect x="10" y="30" width="44" height="24" rx="4" fill="#7A4420"/><rect x="10" y="30" width="44" height="7" fill="#F4C24B"/><path d="M10 30a22 14 0 0 1 44 0Z" fill="#8A5228"/><rect x="28" y="28" width="8" height="14" rx="2" fill="#F4C24B"/><circle cx="32" cy="40" r="2.4" fill="#5a3a06"/></svg>`
}
export function wheelSVG(): string {
  const cx = 131, cy = 131, R = 125, seg = 45
  let s = ''
  for (let i = 0; i < 8; i++) {
    const a0 = ((-90 + i * seg) * Math.PI) / 180, a1 = ((-90 + (i + 1) * seg) * Math.PI) / 180
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
    s += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${WHEEL[i].c}" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/>`
    const am = ((-90 + i * seg + seg / 2) * Math.PI) / 180, tx = cx + R * 0.64 * Math.cos(am), ty = cy + R * 0.64 * Math.sin(am)
    s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${i * seg + seg / 2} ${tx.toFixed(1)} ${ty.toFixed(1)})" font-family="'Poppins',sans-serif" font-weight="800" font-size="15" fill="#fff">${WHEEL[i].t}</text>`
  }
  return `<svg viewBox="0 0 262 262"><g id="wheelSpin">${s}<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff" stroke-width="4" opacity=".5"/></g><circle cx="${cx}" cy="${cy}" r="22" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#F35100" stroke-width="4"/></svg>`
}
export function chestModalSVG(): string {
  return `<svg viewBox="0 0 200 170"><ellipse cx="100" cy="150" rx="70" ry="12" fill="#000" opacity=".15"/><circle class="cglow" cx="100" cy="88" r="58" fill="#FFD86B"/><rect x="42" y="88" width="116" height="58" rx="8" fill="#7A4420"/><rect x="42" y="88" width="116" height="10" fill="#F4C24B"/><rect x="90" y="98" width="20" height="28" rx="3" fill="#F4C24B"/><circle cx="100" cy="118" r="4" fill="#5a3a06"/><g id="chestLid"><path d="M42 92 a58 34 0 0 1 116 0 Z" fill="#8A5228"/><path d="M42 86 h116 v8 h-116 Z" fill="#F4C24B"/></g></svg>`
}
