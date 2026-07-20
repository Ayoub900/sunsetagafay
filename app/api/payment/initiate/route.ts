import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getCmiConfig } from '@/lib/cmi/config'
import { buildInitiateFields } from '@/lib/cmi/params'
import { renderAutoSubmitForm } from '@/lib/cmi/form'
import { createOrLoadOrderForReservation, PaymentError } from '@/lib/cmi/orders'
import { hasLocale } from '@/app/[lang]/dictionaries'

// Needs Node (crypto + Prisma) and must never be cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(body ?? {})) out[k] = String(v ?? '')
    return out
  }
  const form = await req.formData()
  const out: Record<string, string> = {}
  for (const [k, v] of form.entries()) out[k] = String(v)
  return out
}

function errorPage(lang: string, message: string, status = 400): Response {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Payment</title>
<style>body{font-family:system-ui,sans-serif;background:#1f1a14;color:#f2e8d5;display:flex;min-height:100vh;margin:0;align-items:center;justify-content:center;text-align:center}a{color:#c97b5c}</style></head>
<body><div><p>${message}</p><p><a href="/${lang}/reserve">Return to reservations</a></p></div></body></html>`
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`pay-init:${ip}`, 20, 60_000)
  if (!rl.allowed) return errorPage('en', 'Too many requests. Please wait a moment and try again.', 429)

  const params = await readParams(req)
  const lang = hasLocale(params.lang) ? params.lang : 'en'
  const reservationId = (params.reservationId ?? '').trim()

  // The CGV/terms acceptance is required before payment (also enforced in the UI).
  const accepted = params.acceptTerms === 'on' || params.acceptTerms === 'true'
  if (!accepted) {
    return errorPage(lang, 'You must read and accept the Terms of Sale before paying.')
  }
  if (!reservationId) {
    return errorPage(lang, 'Missing reservation reference.')
  }

  try {
    const { order, showStatusInstead } = await createOrLoadOrderForReservation(reservationId, lang)

    // Finalized or under reconciliation: don't re-initiate — show the status
    // page (which tells a possibly-already-charged customer NOT to pay again).
    if (showStatusInstead) {
      return NextResponse.redirect(
        new URL(`/${lang}/reserve/confirmation?oid=${encodeURIComponent(order.oid)}`, req.url),
        303,
      )
    }

    const cfg = getCmiConfig()
    const fields = buildInitiateFields(order, cfg)
    const html = renderAutoSubmitForm(cfg.gatewayUrl, fields)
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // This page holds an about-to-be-signed payment form; never cache it.
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof PaymentError) {
      const msg =
        err.code === 'NOT_CHARGEABLE'
          ? 'This room is not available for online payment. Please contact us to arrange payment.'
          : err.code === 'MISSING_EMAIL'
            ? 'A valid email address is required to take payment.'
            : 'Reservation not found.'
      return errorPage(lang, msg, err.code === 'NOT_FOUND' ? 404 : 400)
    }
    // Never leak internals to the customer.
    // eslint-disable-next-line no-console
    console.error('[cmi][initiate] error', err)
    return errorPage(lang, 'We could not start the payment. Please try again shortly.', 500)
  }
}
