// Read-only preflight for pointing the app at a database that predates the
// online-payment work (typically: the live one). Answers the three questions
// that decide whether a deploy is safe, and changes nothing.
//
//   node --env-file=.env scripts/prod-db-preflight.mjs
//
// 1. Is anything sellable? Every MAD price field defaults to 0 and 0 means
//    "not payable online". Day passes and transfers are card-only, so a 0 there
//    is an item nobody can book at all. Suites fall back to an enquiry.
// 2. Will `prisma db push` succeed? A duplicate SiteSettings.key="default"
//    blocks the whole push, and with it the unique indexes that make callback
//    idempotency real.
// 3. Is there payment history already? Non-zero counts mean this is not the
//    fresh database you think it is.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const mad = c => `${(c / 100).toLocaleString('fr-FR')} MAD`

function bar(label, ok, detail) {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label.padEnd(34)} ${detail}`)
}

async function main() {
  const url = process.env.MONGODB_URL ?? ''
  let where = 'unparseable'
  try {
    const u = new URL(url)
    where = `${u.hostname}${u.pathname}`
  } catch {}
  console.log(`database: ${where}\n`)

  // ── 1. Sellability ────────────────────────────────────────────────────────
  const [suites, passes, transfers] = await Promise.all([
    prisma.suite.findMany({ select: { nameEn: true, rateMadCents: true } }),
    prisma.dayPass.findMany({ select: { nameEn: true, priceMadCents: true } }),
    prisma.transfer.findMany({ select: { nameEn: true, priceMadCents: true } }),
  ])

  const zero = (rows, field) => rows.filter(r => !r[field])
  const zSuites = zero(suites, 'rateMadCents')
  const zPasses = zero(passes, 'priceMadCents')
  const zTransfers = zero(transfers, 'priceMadCents')

  console.log('online prices')
  bar('suites priced', zSuites.length === 0, `${suites.length - zSuites.length}/${suites.length} (0 = enquiry fallback)`)
  bar('day passes priced', zPasses.length === 0, `${passes.length - zPasses.length}/${passes.length} (0 = UNBOOKABLE, card-only)`)
  bar('transfers priced', zTransfers.length === 0, `${transfers.length - zTransfers.length}/${transfers.length} (0 = UNBOOKABLE, card-only)`)
  for (const s of zSuites) console.log(`         · suite unpriced: ${s.nameEn}`)
  for (const p of zPasses) console.log(`         · day pass unpriced: ${p.nameEn}`)
  for (const t of zTransfers) console.log(`         · transfer unpriced: ${t.nameEn}`)
  const priced = [...suites, ...passes, ...transfers].filter(r => r.rateMadCents || r.priceMadCents)
  if (priced.length) {
    const lo = Math.min(...priced.map(r => r.rateMadCents ?? r.priceMadCents))
    const hi = Math.max(...priced.map(r => r.rateMadCents ?? r.priceMadCents))
    console.log(`         priced range: ${mad(lo)} – ${mad(hi)}  (sanity-check the magnitude)`)
  }

  // ── 2. db push blocker ────────────────────────────────────────────────────
  console.log('\nschema push')
  const settings = await prisma.siteSettings.findMany({ select: { id: true, key: true } })
  const dupes = settings.filter(s => s.key === 'default')
  bar('SiteSettings key="default"', dupes.length <= 1, `${dupes.length} row(s) — >1 blocks prisma db push`)
  if (dupes.length > 1) for (const d of dupes) console.log(`         · ${d.id}`)

  // ── 3. Existing payment history ───────────────────────────────────────────
  console.log('\npayment history (expect 0 on a database new to payments)')
  const [orders, callbacks, bookings] = await Promise.all([
    prisma.order.count(),
    prisma.paymentCallback.count(),
    prisma.serviceBooking.count(),
  ])
  console.log(`         orders: ${orders}   callbacks: ${callbacks}   service bookings: ${bookings}`)
  if (orders) {
    const byStatus = await prisma.order.groupBy({ by: ['status'], _count: true })
    for (const g of byStatus) console.log(`         · ${g.status}: ${g._count}`)
    const noRef = await prisma.order.count({ where: { bookingRef: '' } })
    if (noRef) console.log(`         · ${noRef} order(s) without bookingRef — run scripts/migrate-order-booking-ref.mjs`)
  }

  console.log('\nnothing was written.')
}

main()
  .catch(e => {
    console.error('\npreflight failed:', e.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
