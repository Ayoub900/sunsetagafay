// Drives every payment FAILURE path end to end against a running site, without
// a card and without touching the CMI gateway. Everything here is a request our
// own routes would receive from CMI, so it covers our half of the certification
// scenarios; the half that needs the real gateway is listed at the end of a run.
//
//   node scripts/simulate-payment-failures.mjs
//   node scripts/simulate-payment-failures.mjs --base https://test.sunsetagafay.com
//
// It creates one real PENDING booking per run (guest name "CMI Simulation") and
// prints the ids so you can delete them from Admin afterwards. Nothing is ever
// charged and no order is moved to PAID.
//
// Expected copy is read from the dictionary rather than hardcoded, so rewording
// the site does not turn this red.

import en from '../app/dictionaries/en.json' with { type: 'json' }

const baseArg = process.argv.indexOf('--base')
const BASE = (baseArg > -1 ? process.argv[baseArg + 1] : 'http://localhost:3000').replace(/\/+$/, '')
const P = en.payment

let passed = 0
let failed = 0

function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  [32mPASS[0m ${name}`)
  } else {
    failed++
    console.log(`  [31mFAIL[0m ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/** POST a form body, never following the redirect (we assert on Location). */
function post(path, body, headers = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(body).toString(),
  })
}

function json(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const text = (res) => res.text()
const loc = (res) => res.headers.get('location') ?? ''

function futureDates() {
  const iso = (d) => d.toISOString().slice(0, 10)
  const inDays = (n) => new Date(Date.now() + n * 86_400_000)
  return { checkIn: iso(inDays(90)), checkOut: iso(inDays(92)) }
}

async function main() {
  console.log(`\nSimulating payment failures against ${BASE}\n`)

  // ── 1. Input guards on /api/payment/initiate ───────────────────────────────
  console.log('Initiate guards')
  {
    const res = await json('/api/payment/initiate', { reservationId: 'x', lang: 'en' })
    check('terms not accepted -> 400', res.status === 400, `got ${res.status}`)
  }
  {
    // Regression guard: a malformed id used to reach Prisma and throw, so the
    // customer got a 500 instead of the clean "not found" page.
    const res = await json('/api/payment/initiate', {
      reservationId: 'FAKEID123', lang: 'en', acceptTerms: 'true',
    })
    check('malformed booking id -> 404 (not 500)', res.status === 404, `got ${res.status}`)
  }
  {
    const res = await json('/api/payment/initiate', {
      reservationId: '000000000000000000000000', lang: 'en', acceptTerms: 'true',
    })
    check('well-formed but unknown id -> 404', res.status === 404, `got ${res.status}`)
  }
  {
    const res = await json('/api/payment/initiate', { lang: 'en', acceptTerms: 'true' })
    check('missing booking reference -> 400', res.status === 400, `got ${res.status}`)
  }
  {
    const res = await json('/api/payment/initiate', {
      reservationId: '000000000000000000000000',
      serviceBookingId: '000000000000000000000000',
      lang: 'en', acceptTerms: 'true',
    })
    check('ambiguous booking reference -> 400', res.status === 400, `got ${res.status}`)
  }

  // ── 2. A real order to fail against ────────────────────────────────────────
  console.log('\nSetup')
  const { checkIn, checkOut } = futureDates()
  const avail = await (await json('/api/availability', { checkIn, checkOut, guests: 2 })).json()
  const suite = avail.suites?.[0]
  if (!suite) throw new Error(`no suites bookable for ${checkIn}..${checkOut}`)

  const booking = await (await json('/api/book', {
    suiteName: suite.nameEn, checkIn, checkOut, nights: 2, guests: 2,
    total: String(suite.rateNum * 2),
    guestName: 'CMI Simulation', email: 'cmi-test@example.com', phone: '+212600000000',
    country: 'Morocco', notes: 'AUTOMATED FAILURE SIMULATION — safe to delete',
  })).json()
  if (!booking.id) throw new Error(`booking failed: ${JSON.stringify(booking)}`)
  check('test booking created', !!booking.id)
  check('suite is payable online', booking.chargeable === true, 'set a MAD price in Admin -> Suites')

  const initRes = await json('/api/payment/initiate', {
    reservationId: booking.id, lang: 'en', acceptTerms: 'true',
  })
  const initHtml = await text(initRes)
  const oid = initHtml.match(/name="oid" value="([^"]+)"/)?.[1]
  const cookie = (initRes.headers.get('set-cookie') ?? '').split(';')[0]
  check('payment form signed and returned', !!oid)
  console.log(`       reservation ${booking.id} (${booking.ref})  oid ${oid}`)

  // ── 3. The declined return ─────────────────────────────────────────────────
  console.log('\nDeclined payment (failUrl)')
  const declined = await post('/api/payment/fail', {
    oid, lang: 'en', Response: 'Declined', ProcReturnCode: '51',
    ErrCode: '51', ErrMsg: 'Not sufficient funds', mdStatus: '1', amount: '11600.00',
  })
  check('303 back to the failure page', declined.status === 303, `got ${declined.status}`)
  check('retry reference carried', loc(declined).includes(`r=${booking.id}`), loc(declined))

  const failPage = await text(await fetch(`${BASE}/en/reserve/payment-failed?r=${booking.id}`))
  check('failure page shows "no charge was made"', failPage.includes(P.failed_sub))
  check('failure page offers a retry', failPage.includes(P.retry_cta))
  check('retry re-requires the terms checkbox', failPage.includes('name="acceptTerms"'))

  // A declined attempt must never move the order: if it had, initiate would
  // redirect to the status page instead of handing back a payment form.
  const retry = await json('/api/payment/initiate', {
    reservationId: booking.id, lang: 'en', acceptTerms: 'true',
  })
  const retryHtml = await text(retry)
  check('order untouched by the decline (form, not a redirect)', retry.status === 200)
  check('retry reuses the same oid', retryHtml.includes(`name="oid" value="${oid}"`))
  check(
    'retry mints a fresh rnd',
    (retryHtml.match(/name="rnd" value="([^"]+)"/)?.[1] ?? '')
      !== (initHtml.match(/name="rnd" value="([^"]+)"/)?.[1] ?? ''),
  )

  // ── 4. The stripped return (the 3D-1004 shape) ─────────────────────────────
  console.log('\nReturn with no usable oid (3D-1004 shape)')
  const stripped = { lang: 'en', Response: 'Error', ErrMsg: '3D-1004' }
  const withCookie = await post('/api/payment/fail', stripped, { cookie })
  check(
    'cookie fallback still offers a retry',
    loc(withCookie).includes(`r=${booking.id}`),
    loc(withCookie),
  )

  const noCookie = await post('/api/payment/fail', stripped)
  check('no cookie -> no invented reference', !/[?&][rs]=/.test(loc(noCookie)), loc(noCookie))

  const forged = await post('/api/payment/fail', stripped, { cookie: 'sa_pay_ref=r:FAKEID123' })
  check('forged cookie rejected', !/[?&][rs]=/.test(loc(forged)), loc(forged))

  // ── 5. What the customer is told afterwards ────────────────────────────────
  console.log('\nConfirmation page copy')
  const afterDecline = await text(await fetch(`${BASE}/en/reserve/confirmation?oid=${oid}`))
  check('declined order reads as unpaid', afterDecline.includes(P.unpaid_title))
  check('declined order offers to complete payment', afterDecline.includes(P.unpaid_cta))
  check('declined order is NOT told to stop paying', !afterDecline.includes(P.pending_sub))

  // The dangerous case: the customer paid, but the okUrl return failed hash
  // verification, so the order is still PENDING. It must never invite payment.
  console.log('\nPaid, but the okUrl return did not verify')
  await post('/api/payment/ok', {
    oid, lang: 'en', Response: 'Approved', ProcReturnCode: '00',
    amount: '11600.00', HASH: 'deliberately-invalid',
  })
  const afterOk = await text(await fetch(`${BASE}/en/reserve/confirmation?oid=${oid}`))
  check('falls back to "being confirmed"', afterOk.includes(P.pending_sub))
  check('payment button withdrawn', !afterOk.includes(P.unpaid_cta))

  console.log(`\n${passed} passed, ${failed} failed`)
  console.log(`\nLeft behind (delete in Admin -> Reservations): ${booking.ref} / ${booking.id}`)
  console.log(`
Still needs the real gateway and a card — run these by hand:
  - a genuine decline (wrong CVV / expiry on a test card)
  - invalid store key -> 3D-1004: set a wrong CMI_STORE_KEY, attempt a payment,
    and confirm the order is PENDING both before and after
  - whether CMI itself accepts the reused oid on the second attempt
  - expiry: POST /api/payment/reconcile?expire=true with CRON_SECRET on an order
    older than 24h, then reload the confirmation page (expect the cancelled copy)
`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\nsimulation aborted:', err.message)
  process.exit(1)
})
