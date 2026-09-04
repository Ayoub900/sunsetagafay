import { isObjectId } from './util'

// A retry hint dropped at initiate time so the failure page can still offer
// "try again" when the failUrl POST comes back without a usable oid — the
// signature of the 3D-1004 (bad store key) path, where CMI returns a minimal
// payload and we cannot resolve the order. Holds only the booking id, which
// already travels in URLs; the retry it enables still re-accepts the terms and
// is re-priced server-side.
//
// SameSite=None is required, not lax convenience: the browser arrives at
// /api/payment/fail via a cross-site POST from CMI, and a Lax cookie is not
// sent on that request (nor on the redirect it triggers).

export const PAY_REF_COOKIE = 'sa_pay_ref'
const MAX_AGE_SECONDS = 60 * 60 // one payment attempt, generously

export type PayRef = { reservationId: string } | { serviceBookingId: string }

/** Serialize the retry hint into a Set-Cookie value. */
export function payRefCookie(ref: PayRef): string {
  const value = 'reservationId' in ref ? `r:${ref.reservationId}` : `s:${ref.serviceBookingId}`
  return `${PAY_REF_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=None`
}

/** Parse it back, rejecting anything that is not a well-formed booking id. */
export function parsePayRef(raw: string | undefined): PayRef | null {
  if (!raw) return null
  const id = raw.slice(2)
  if (!isObjectId(id)) return null
  if (raw.startsWith('r:')) return { reservationId: id }
  if (raw.startsWith('s:')) return { serviceBookingId: id }
  return null
}
