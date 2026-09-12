// Read-only audit of the payment trail. Changes nothing.
//
//   node --env-file=.env scripts/payment-audit.mjs
//
// Answers the question the admin screens cannot: for every order that is not
// settled, did CMI ever reach us at all?
//
//   callbacks: NONE          -> CMI could not deliver. Check CMI_BASE_URL points
//                               at the public site, then look the oid up in the
//                               Merchant Center: the money may well be there.
//   callbacks with proc=00   -> CMI reached us and the payment succeeded; the
//                               transition failed for another reason (read the
//                               hashValid / amountMatched flags on the row).
//   callbacks with proc!=00  -> a genuine declined attempt. Nothing owed.
//
// A PAID order with fulfilled=NO never ran fulfilment: no confirmation email,
// and its booking is still sitting at Pending.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const mad = c => `${(c / 100).toFixed(2)} MAD`

async function main() {
  const u = new URL(process.env.MONGODB_URL ?? '')
  console.log(`database: ${u.hostname}${u.pathname}\n`)

  const [paid, pending, underRec, cancelled, refunded, callbacks] = await Promise.all([
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'UNDER_RECONCILIATION' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.count({ where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
    prisma.paymentCallback.count(),
  ])
  console.log(`orders    PAID=${paid} PENDING=${pending} UNDER_RECONCILIATION=${underRec} CANCELLED=${cancelled} REFUNDED=${refunded}`)
  console.log(`callbacks ${callbacks} recorded in total\n`)

  const unsettled = await prisma.order.findMany({
    where: { status: { in: ['PENDING', 'UNDER_RECONCILIATION'] } },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`── unsettled orders (${unsettled.length}) ──────────────────────────────`)
  for (const o of unsettled) {
    const cbs = await prisma.paymentCallback.findMany({
      where: { oid: o.oid },
      orderBy: { createdAt: 'asc' },
      select: { channel: true, hashValid: true, amountMatched: true, procReturnCode: true, responseSent: true, createdAt: true },
    })
    console.log(`\n${o.oid}  ${o.status}  ${mad(o.amount)}  ${o.customerName} <${o.customerEmail}>`)
    console.log(`   ref=${o.bookingRef}  created=${o.createdAt.toISOString()}  transId=${o.transId ?? '-'}`)
    if (cbs.length === 0) {
      console.log(`   callbacks: NONE — CMI never reached this app`)
    } else {
      for (const c of cbs) {
        console.log(`   callback: ${c.channel} hashValid=${c.hashValid} amountMatched=${c.amountMatched} proc=${c.procReturnCode ?? '-'} sent=${c.responseSent} at=${c.createdAt.toISOString()}`)
      }
    }
  }

  const settled = await prisma.order.findMany({
    where: { status: 'PAID' },
    orderBy: { paidAt: 'desc' },
    take: 15,
    select: { oid: true, amount: true, cmiStatus: true, paidAt: true, fulfilledAt: true, customerName: true },
  })
  console.log(`\n── settled orders, newest ${settled.length} ────────────────────────────`)
  for (const o of settled) {
    console.log(`   ${o.oid}  ${mad(o.amount)}  cmiStatus=${o.cmiStatus ?? '-'}  paidAt=${o.paidAt?.toISOString() ?? '-'}  fulfilled=${o.fulfilledAt ? 'yes' : 'NO'}  ${o.customerName}`)
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
