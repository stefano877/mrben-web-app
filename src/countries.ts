export interface Country { code: string; name: string; dial: string }

// MrBen targets worldwide excluding the United States.
export const countries: Country[] = [
  { code: 'GB', name: 'United Kingdom', dial: '44' }, { code: 'IE', name: 'Ireland', dial: '353' },
  { code: 'DE', name: 'Germany', dial: '49' }, { code: 'FR', name: 'France', dial: '33' },
  { code: 'ES', name: 'Spain', dial: '34' }, { code: 'PT', name: 'Portugal', dial: '351' },
  { code: 'IT', name: 'Italy', dial: '39' }, { code: 'NL', name: 'Netherlands', dial: '31' },
  { code: 'BE', name: 'Belgium', dial: '32' }, { code: 'SE', name: 'Sweden', dial: '46' },
  { code: 'NO', name: 'Norway', dial: '47' }, { code: 'DK', name: 'Denmark', dial: '45' },
  { code: 'FI', name: 'Finland', dial: '358' }, { code: 'PL', name: 'Poland', dial: '48' },
  { code: 'AT', name: 'Austria', dial: '43' }, { code: 'CH', name: 'Switzerland', dial: '41' },
  { code: 'GR', name: 'Greece', dial: '30' }, { code: 'RO', name: 'Romania', dial: '40' },
  { code: 'HU', name: 'Hungary', dial: '36' }, { code: 'CZ', name: 'Czechia', dial: '420' },
  { code: 'BR', name: 'Brazil', dial: '55' }, { code: 'MX', name: 'Mexico', dial: '52' },
  { code: 'AR', name: 'Argentina', dial: '54' }, { code: 'CL', name: 'Chile', dial: '56' },
  { code: 'CO', name: 'Colombia', dial: '57' }, { code: 'PE', name: 'Peru', dial: '51' },
  { code: 'EC', name: 'Ecuador', dial: '593' }, { code: 'UY', name: 'Uruguay', dial: '598' },
  { code: 'PY', name: 'Paraguay', dial: '595' }, { code: 'BO', name: 'Bolivia', dial: '591' },
  { code: 'VE', name: 'Venezuela', dial: '58' },
  { code: 'ZA', name: 'South Africa', dial: '27' }, { code: 'NG', name: 'Nigeria', dial: '234' },
  { code: 'KE', name: 'Kenya', dial: '254' }, { code: 'GH', name: 'Ghana', dial: '233' },
  { code: 'EG', name: 'Egypt', dial: '20' }, { code: 'MA', name: 'Morocco', dial: '212' },
  { code: 'TN', name: 'Tunisia', dial: '216' }, { code: 'DZ', name: 'Algeria', dial: '213' },
  { code: 'IN', name: 'India', dial: '91' }, { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'BD', name: 'Bangladesh', dial: '880' }, { code: 'PH', name: 'Philippines', dial: '63' },
  { code: 'ID', name: 'Indonesia', dial: '62' }, { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'TH', name: 'Thailand', dial: '66' }, { code: 'VN', name: 'Vietnam', dial: '84' },
  { code: 'JP', name: 'Japan', dial: '81' }, { code: 'KR', name: 'South Korea', dial: '82' },
  { code: 'AU', name: 'Australia', dial: '61' }, { code: 'NZ', name: 'New Zealand', dial: '64' },
  { code: 'CA', name: 'Canada', dial: '1' }, { code: 'TR', name: 'Türkiye', dial: '90' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' }, { code: 'SA', name: 'Saudi Arabia', dial: '966' },
].sort((a, b) => a.name.localeCompare(b.name))

export const byCode = (code: string) => countries.find(c => c.code === code)
// Country flags are emoji, so they are intentionally not rendered. Kept as a
// no-op so call sites (country select, account) don't need to change.
export const flag = (_code: string) => ''

const DEFAULT = 'GB'

// Geo-locate the visitor by IP; returns an ISO2 code that exists in our list, else the default.
export async function detectCountry(): Promise<string> {
  try {
    const ctl = AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
    const res = await fetch('https://ipwho.is/', ctl ? { signal: ctl } : {})
    const j = await res.json()
    const code: string | undefined = j && (j.country_code || j.countryCode)
    if (code && byCode(code)) return code
  } catch { /* offline or blocked, fall back */ }
  return DEFAULT
}
