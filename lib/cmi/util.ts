import { randomBytes } from 'node:crypto'

// Money is stored and compared as integer minor units (MAD centimes). We only
// ever cross into decimal strings at the CMI boundary, and never via floating
// point, to satisfy the spec's "never compare JS floats" rule.

/** Format integer minor units to the decimal string CMI expects: 2995 -> "29.95". */
export function formatMinorUnits(minor: number): string {
  const neg = minor < 0
  const abs = Math.abs(Math.trunc(minor))
  const major = Math.floor(abs / 100)
  const cents = String(abs % 100).padStart(2, '0')
  return `${neg ? '-' : ''}${major}.${cents}`
}

/**
 * Parse a CMI decimal amount string ("29.95", "1200", "1200.0") to integer
 * minor units without floating point. The PDF allows either "." or "," as the
 * decimal separator, so both are accepted. Returns null if malformed.
 */
export function parseAmountToMinor(s: string): number | null {
  const m = s.trim().match(/^(\d+)(?:[.,](\d{1,2}))?$/)
  if (!m) return null
  const major = parseInt(m[1], 10)
  const frac = (m[2] ?? '').padEnd(2, '0')
  return major * 100 + parseInt(frac, 10)
}

/**
 * Generate a fresh order id: alphanumeric only, well under 64 chars, no special
 * characters. Prefix + base36 timestamp + random hex — all in [A-Z0-9].
 */
export function newOid(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = randomBytes(6).toString('hex').toUpperCase()
  return `SA${ts}${rand}`.slice(0, 64)
}

/**
 * A random nonce for the CMI `rnd` field. The PDF specifies format (20) and
 * both callback examples show exactly 20 alphanumeric characters, so we emit
 * 20 chars of [A-Za-z0-9].
 */
export function newRnd(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(20)
  let out = ''
  for (let i = 0; i < 20; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

/** Map a site locale to a CMI-supported language code (ar | fr | en). */
export function toCmiLang(locale: string | undefined): 'ar' | 'fr' | 'en' {
  if (locale === 'fr') return 'fr'
  if (locale === 'ar') return 'ar'
  return 'en'
}
