import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getCmiConfig, publicBaseUrl } from '@/lib/cmi/config'
import { verifyHash } from '@/lib/cmi/hash'
import {
  ci,
  getOrderByOid,
  markOrderUnderReconciliation,
  persistCallback,
  type RawParams,
} from '@/lib/cmi/orders'
import { alertPayment } from '@/lib/cmi/observability'

// okUrl: the browser is POSTed here after a (claimed) successful payment. This
// is a DISPLAY/fallback channel only — the authoritative status transition to
// PAID happens exclusively in the host-to-host callback. We verify the hash,
// and if no valid callback has finalized the order yet, mark it
// UNDER_RECONCILIATION (only from PENDING) and show a "being confirmed" state.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const base = publicBaseUrl(req.url)
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`cmi-ok:${ip}`, 60, 60_000)
  if (!rl.allowed) return NextResponse.redirect(new URL('/en/reserve', base), 303)

  let params: RawParams = {}
  const len = parseInt(req.headers.get('content-length') ?? '0', 10)
  try {
    if (len <= 64 * 1024) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) params[k] = String(v)
    }
  } catch {
    /* fall through to a generic redirect */
  }

  const oid = (ci(params, 'oid') ?? '').trim()
  const lang = (ci(params, 'lang') ?? 'en').toLowerCase() === 'fr' ? 'fr' : 'en'
  const dest = new URL(`/${lang}/reserve/confirmation`, base)
  if (oid) dest.searchParams.set('oid', oid)

  try {
    const cfg = getCmiConfig()
    const { ok: hashOk } = verifyHash(params, cfg.storeKey)
    const order = oid ? await getOrderByOid(oid) : null

    // Persist the browser return for the audit trail / certification file —
    // only for known orders, so junk POSTs can't flood the collection.
    if (order) {
      await persistCallback({
        params, channel: 'okurl', orderId: order.id, oid,
        hashValid: hashOk, responseSent: hashOk ? 'handled' : 'hash-invalid',
      }).catch(() => {})
    }

    if (!hashOk) {
      // Do not trust unverified return data; the confirmation page still reads
      // the authoritative DB status. Alert so a tampered return is visible.
      alertPayment('HASH_VERIFICATION_FAILED', { oid, channel: 'okurl' })
      return NextResponse.redirect(dest, 303)
    }

    if (order && order.status !== 'PAID') {
      // The callback hasn't finalized this order yet (customer returned first,
      // or the callback failed). Move PENDING -> UNDER_RECONCILIATION.
      const moved = await markOrderUnderReconciliation(oid)
      if (moved) alertPayment('UNDER_RECONCILIATION', { oid, channel: 'okurl' })
    }
    return NextResponse.redirect(dest, 303)
  } catch (err) {
    alertPayment('CALLBACK_ERROR', { oid, channel: 'okurl', message: String(err) })
    return NextResponse.redirect(dest, 303)
  }
}
