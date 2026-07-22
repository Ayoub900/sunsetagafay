import 'server-only'

// Structured logging + alerting for the payment flow. NEVER logs the store key,
// the hash plaintext, or full card data — only what is safe to persist
// (MaskedPan as received from CMI is fine).
//
// Alerts currently route to the process logs with a stable, greppable prefix so
// they can be shipped to an alerting backend. Wire `alertPayment` to email or
// an admin notification channel in production (see CMI-PAYMENT.md).

export type AlertKind =
  | 'HASH_VERIFICATION_FAILED'
  | 'FAILURE_RESPONSE_RETURNED'
  | 'AMOUNT_MISMATCH'
  | 'UNDER_RECONCILIATION'
  | 'CALLBACK_ERROR'
  | 'ORDER_NOT_FOUND'

const REDACT = new Set(['hash', 'HASH', 'storekey', 'storeKey', 'pan', 'PAN'])

/** Drop any obviously sensitive keys before logging a payload snapshot. */
function safe(detail: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(detail)) {
    if (REDACT.has(k)) continue
    out[k] = v
  }
  return out
}

export function alertPayment(kind: AlertKind, detail: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.error(`[cmi][alert][${kind}]`, JSON.stringify(safe(detail)))
}

export function logCallback(outcome: string, detail: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.info(`[cmi][callback][${outcome}]`, JSON.stringify(safe(detail)))
}

/**
 * Log the exact field set about to be POSTed to est3dgate, with the derived
 * `hash` redacted (it is a function of the secret store key). This is the
 * primary diagnostic for the 3-D Secure routing problem: it lets us confirm
 * `storetype=3d_pay_hosting`, `hashAlgorithm=ver3`, and that nothing is missing
 * or misspelled before the browser is redirected. Store key is never present in
 * the field set, so nothing secret is emitted.
 */
export function logInitiate(oid: string, fields: Record<string, string>): void {
  const { hash: _hash, ...rest } = fields
  // eslint-disable-next-line no-console
  console.info(
    `[cmi][initiate]`,
    JSON.stringify({ oid, storetype: fields.storetype, hashPresent: Boolean(_hash), fields: rest }),
  )
}

/**
 * Log the 3-D Secure authentication fields returned on any channel (callback /
 * okUrl / failUrl). These are exactly the values the CMI certification file and
 * the back office use to distinguish an authenticated `3D Secure` transaction
 * (mdStatus 1–4 with CAVV/ECI present) from an unauthenticated `E-COMMERCE` one.
 */
export function log3dReturn(
  channel: 'callback' | 'okurl' | 'failurl',
  detail: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.info(`[cmi][3ds][${channel}]`, JSON.stringify(safe(detail)))
}
