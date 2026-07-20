import { after, type NextRequest } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getCmiConfig } from '@/lib/cmi/config'
import { verifyHash } from '@/lib/cmi/hash'
import {
  ci,
  getOrderByOid,
  receivedAmountMinor,
  extractPaymentData,
  markOrderPaid,
  persistCallback,
  fulfillPaidOrder,
  type RawParams,
} from '@/lib/cmi/orders'
import { alertPayment, logCallback } from '@/lib/cmi/observability'

// The authoritative channel for order status. Publicly reachable, no auth, no
// CSRF. Must respond fast with a bare text/plain body.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Exactly one of ACTION=POSTAUTH | APPROVED | FAILURE. No JSON, no HTML, no
// extra whitespace, no framework error page.
function plain(body: 'ACTION=POSTAUTH' | 'APPROVED' | 'FAILURE'): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  })
}

// The endpoint is public by spec (no auth, no CSRF), so cap abuse instead:
// a generous per-IP rate limit (legit CMI traffic is one request per payment
// attempt) and a body-size ceiling before parsing.
const MAX_BODY_BYTES = 64 * 1024
const RATE_LIMIT = 120 // per IP per minute

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`cmi-cb:${ip}`, RATE_LIMIT, 60_000)
  if (!rl.allowed) return plain('FAILURE')

  const len = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (len > MAX_BODY_BYTES) return plain('FAILURE')

  // Parse the x-www-form-urlencoded body. Any parse failure => FAILURE.
  let params: RawParams = {}
  try {
    const form = await req.formData()
    for (const [k, v] of form.entries()) params[k] = String(v)
  } catch {
    return plain('FAILURE')
  }

  const oid = (ci(params, 'oid') ?? '').trim()

  try {
    const cfg = getCmiConfig()

    // 1) Recompute + constant-time compare the hash over ALL received params.
    const { ok: hashOk } = verifyHash(params, cfg.storeKey)
    if (!hashOk) {
      alertPayment('HASH_VERIFICATION_FAILED', { oid })
      // Persist for the audit trail only when the oid maps to a real order —
      // otherwise unverifiable junk aimed at random oids could flood the DB.
      const order = oid ? await getOrderByOid(oid) : null
      if (order) {
        await persistCallback({
          params, channel: 'callback', orderId: order.id, oid,
          hashValid: false, responseSent: 'FAILURE',
        })
      } else {
        logCallback('FAILURE(unverified-unknown-oid)', { oid, ip })
      }
      return plain('FAILURE')
    }

    // 2) Order lookup.
    const order = await getOrderByOid(oid)
    if (!order) {
      alertPayment('ORDER_NOT_FOUND', { oid })
      await persistCallback({ params, channel: 'callback', oid, hashValid: true, responseSent: 'FAILURE' })
      return plain('FAILURE')
    }

    // 3) Amount check in integer minor units (never floats).
    const received = receivedAmountMinor(params)
    const amountMatched = received != null && received === order.amount
    if (!amountMatched) {
      alertPayment('AMOUNT_MISMATCH', { oid, expected: order.amount, received })
      await persistCallback({
        params, channel: 'callback', orderId: order.id, oid,
        hashValid: true, amountMatched: false, responseSent: 'FAILURE',
      })
      return plain('FAILURE')
    }

    // 4) Decision on ProcReturnCode.
    const proc = ci(params, 'ProcReturnCode')
    if (proc === '00') {
      // Success: atomically PENDING|UNDER_RECONCILIATION -> PAID, persist data,
      // request capture with ACTION=POSTAUTH. Business fulfillment runs async,
      // only for the winning transition, after this response is sent.
      const won = await markOrderPaid(oid, order.amount, extractPaymentData(params))
      const { duplicate } = await persistCallback({
        params, channel: 'callback', orderId: order.id, oid,
        hashValid: true, amountMatched: true, responseSent: 'ACTION=POSTAUTH',
      })
      if (won && !duplicate) {
        after(async () => {
          try {
            await fulfillPaidOrder(order.id)
          } catch (e) {
            alertPayment('CALLBACK_ERROR', { oid, stage: 'fulfillment', message: String(e) })
          }
        })
      }
      logCallback('POSTAUTH', { oid, transId: ci(params, 'TransId'), duplicate })
      return plain('ACTION=POSTAUTH')
    }

    // Non-'00' (or absent): do NOT change status, record the failed attempt,
    // acknowledge with APPROVED.
    await persistCallback({
      params, channel: 'callback', orderId: order.id, oid,
      hashValid: true, amountMatched: true, responseSent: 'APPROVED',
    })
    logCallback('APPROVED(failed-attempt)', {
      oid, proc, errCode: ci(params, 'ErrCode'), errMsg: ci(params, 'ErrMsg'),
    })
    return plain('APPROVED')
  } catch (err) {
    // Any technical error anywhere => FAILURE (merchant reconciles manually).
    alertPayment('CALLBACK_ERROR', { oid, message: String(err) })
    try {
      await persistCallback({ params, channel: 'callback', oid, hashValid: false, responseSent: 'FAILURE' })
    } catch {
      /* best-effort */
    }
    return plain('FAILURE')
  }
}
