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
