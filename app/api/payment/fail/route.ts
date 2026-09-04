import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getCmiConfig, publicBaseUrl } from '@/lib/cmi/config'
import { verifyHash } from '@/lib/cmi/hash'
import { ci, getOrderByOid, persistCallback, type RawParams } from '@/lib/cmi/orders'
import { alertPayment, log3dReturn } from '@/lib/cmi/observability'

// failUrl: the browser is POSTed here after a declined/errored payment. Never
// changes the order status (failed attempts must not). Verifies the hash for
// the audit trail, then redirects to the failure page which offers a retry that
// reuses the same oid. Precise rejection reasons are kept in logs, never shown.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const base = publicBaseUrl(req.url)
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`cmi-fail:${ip}`, 60, 60_000)
  if (!rl.allowed) return NextResponse.redirect(new URL('/en/reserve', base), 303)

  let params: RawParams = {}
  const len = parseInt(req.headers.get('content-length') ?? '0', 10)
  try {
    if (len <= 64 * 1024) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) params[k] = String(v)
    }
  } catch {
    /* fall through */
  }

  const oid = (ci(params, 'oid') ?? '').trim()
  const lang = (ci(params, 'lang') ?? 'en').toLowerCase() === 'fr' ? 'fr' : 'en'
  const dest = new URL(`/${lang}/reserve/payment-failed`, base)

  try {
    const cfg = getCmiConfig()
    const { ok: hashOk } = verifyHash(params, cfg.storeKey)
    const order = oid ? await getOrderByOid(oid) : null

    // Diagnostic: empty mdStatus / cavv / eci here is the signature of the
    // E-COMMERCE (unauthenticated) routing this fix is chasing.
    log3dReturn('failurl', {
      oid,
      mdStatus: ci(params, 'mdStatus'),
      txstatus: ci(params, 'txstatus'),
      cavv: ci(params, 'cavv') ? 'present' : '',
      eci: ci(params, 'eci'),
      xid: ci(params, 'xid') ? 'present' : '',
      ProcReturnCode: ci(params, 'ProcReturnCode'),
      ErrMsg: ci(params, 'ErrMsg'),
    })

    // Carry the booking reference so the failure page can offer a retry that
    // reuses the same oid. `r` = room reservation, `s` = day pass / transfer.
    if (order?.reservationId) dest.searchParams.set('r', order.reservationId)
    if (order?.serviceBookingId) dest.searchParams.set('s', order.serviceBookingId)

    // Only persist browser returns for known orders (anti-flooding).
    if (order) {
      await persistCallback({
        params, channel: 'failurl', orderId: order.id, oid,
        hashValid: hashOk, responseSent: 'failure-display',
      }).catch(() => {})
    }

    alertPayment('FAILURE_RESPONSE_RETURNED', {
      oid, channel: 'failurl', hashOk,
      response: ci(params, 'Response'), errCode: ci(params, 'ErrCode'),
    })

    return NextResponse.redirect(dest, 303)
  } catch (err) {
    alertPayment('CALLBACK_ERROR', { oid, channel: 'failurl', message: String(err) })
    return NextResponse.redirect(dest, 303)
  }
}
