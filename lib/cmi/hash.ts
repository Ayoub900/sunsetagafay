import { createHash, timingSafeEqual } from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// CMI "Online payment integration V2.0" — hash algorithm ver3.
//
// This single function is the authority for BOTH the outbound payment request
// and the inbound callback / return verification. It intentionally has no
// Next.js or server-only imports so it can be unit-tested in isolation.
//
// Reference (PHP, from the CMI PDF):
//   $plaintext .= escapedValue . "|"  (for each param, sorted, except hash/encoding)
//   $plaintext .= escapedStoreKey
//   $hash = base64_encode(pack('H*', hash('sha512', $plaintext)))
//
// UTF-8 rule: never strip / transliterate / normalize non-ASCII characters.
// The bytes we hash are the exact UTF-8 bytes we post.
// ─────────────────────────────────────────────────────────────────────────────

export type HashParams = Record<string, string | number | null | undefined>

/**
 * Escape a value for the `|`-delimited plaintext: backslash first, then pipe.
 * Order matters — escaping `|` first would double-escape the backslash we add.
 */
export function cmiEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}

/**
 * Anti-XSS rule: any single character immediately following the literal string
 * "document" is replaced by ".".
 *   "document abc" -> "document.abc"
 *   "documentabc"  -> "document.bc"
 * Applied case-insensitively and across newlines. Applied to the RAW value,
 * before escaping — the two operations are commutative for every realistic
 * value (values never contain "document" immediately followed by `\` or `|`),
 * and operating on the raw value avoids ever corrupting an escape sequence.
 */
export function cmiAntiXss(value: string): string {
  // Capture the keyword so its original casing is preserved; only the single
  // character that follows it is replaced with ".". [\s\S] matches any char
  // including newlines without needing the dotAll flag (older TS target).
  return value.replace(/(document)[\s\S]/gi, '$1.')
}

function transformValue(raw: string): string {
  // Trim is idempotent; the caller trims values before both hashing and
  // posting, and we trim here defensively so the two can never diverge.
  return cmiEscape(cmiAntiXss(raw.trim()))
}

/**
 * PHP `natcasesort` equivalent: natural (numeric-aware), case-insensitive order.
 */
function natCaseSort(names: string[]): string[] {
  return [...names].sort((a, b) =>
    a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }),
  )
}

/** Case-insensitive membership check for the excluded param names. */
function isExcluded(name: string): boolean {
  const l = name.toLowerCase()
  return l === 'hash' || l === 'encoding'
}

/**
 * Build the exact plaintext that gets SHA-512'd. Exposed for testing so the
 * escaping / sorting / anti-XSS / accent handling can be asserted directly,
 * independent of the crypto step.
 */
export function buildHashPlaintext(params: HashParams, storeKey: string): string {
  const names = natCaseSort(
    Object.keys(params).filter((n) => !isExcluded(n)),
  )
  const escapedValues = names.map((n) => transformValue(String(params[n] ?? '')))
  // Store key uses the same `\` / `|` escaping (NOT the anti-XSS rule).
  return escapedValues.join('|') + '|' + cmiEscape(storeKey)
}

/**
 * Compute the ver3 hash: base64( raw_bytes( sha512_hex( plaintext ) ) ).
 * We build the hex digest and re-pack it to mirror the PHP reference exactly;
 * this is byte-identical to digest('base64') (asserted in the tests).
 */
export function computeHash(params: HashParams, storeKey: string): string {
  const plaintext = buildHashPlaintext(params, storeKey)
  const hex = createHash('sha512').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hex, 'hex').toString('base64')
}

/** Locate a param case-insensitively (CMI may send HASH, Hash, hash…). */
function getCaseInsensitive(params: HashParams, key: string): string | undefined {
  const target = key.toLowerCase()
  for (const k of Object.keys(params)) {
    if (k.toLowerCase() === target) {
      const v = params[k]
      return v == null ? undefined : String(v)
    }
  }
  return undefined
}

/**
 * Verify a received callback / return hash. Recomputes over ALL received params
 * except hash/encoding and compares constant-time against the received HASH.
 */
export function verifyHash(
  params: HashParams,
  storeKey: string,
): { ok: boolean; computed: string; received: string | null } {
  const received = getCaseInsensitive(params, 'hash') ?? null
  const computed = computeHash(params, storeKey)
  return { ok: received != null && constantTimeEqual(computed, received), computed, received }
}

/**
 * Constant-time string comparison. Validates the received value is well-formed
 * base64 of the expected byte length before comparing, so timingSafeEqual is
 * never handed mismatched-length buffers (which would throw and leak timing).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // Base64 of a 64-byte SHA-512 digest is always 88 chars. Reject early on any
  // shape mismatch, but do the final compare in constant time.
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
