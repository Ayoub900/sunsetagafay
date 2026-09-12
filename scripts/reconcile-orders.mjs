// Apply, by hand, the transition the host-to-host callback should have applied
// automatically — for transactions that CMI approved but never delivered to us
// (see scripts/payment-audit.mjs: "callbacks: NONE").
//
//   node --env-file=.env scripts/reconcile-orders.mjs          # dry run
//   node --env-file=.env scripts/reconcile-orders.mjs --apply
//
// The CMI Merchant Center is the source of truth. Every value in RECORDS below
// is transcribed from its transaction export, and the script refuses to touch
// an order whose stored amount does not match the amount CMI approved.
//
// It mirrors markOrderPaid + fulfillPaidOrder in lib/cmi/orders.ts, with two
// deliberate differences:
//
//   - `postAuthRequestedAt` is NOT set. The real flow sets it because it answers
//     the callback with ACTION=POSTAUTH; no callback ran here, so CMI was never
//     asked to capture. Recording a capture request that never happened would
//     be a lie, and the money really is still only pre-authorized.
//   - No email is sent. Fulfilment normally mails the guest; that is an
//     outward-facing side effect, so it stays a separate, deliberate step.
//
// Nothing is written to PaymentCallback: that collection is the CMI audit trail
// and must only ever contain callbacks CMI actually sent.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const mad = c => `${(c / 100).toFixed(2)} MAD`

// Transcribed from the CMI Merchant Center export, 09-September-2026.
// All three: Transaction Type "Pre Authorization", Status "Successful",
// Bank Response Code 00 / APPROVED, Full 3DSecure.
const RECORDS = [
  {
    oid: 'SAMTU7OHVACC74FA727F41',
    expectAmount: 90000,
    transId: '26252PvOJ12519543',
    authCode: '415209',
    maskedPan: '456188******3610',
    cardBrand: 'VISA',
    trxDate: '09-09-2026 15:47',
    paidAt: new Date('2026-09-09T15:47:00+01:00'),
  },
  {
    oid: 'SAMTU79URAE2CA7FE3972D',
    expectAmount: 90000,
    transId: '26252PIqE12504656',
    authCode: '501852',
    maskedPan: '456188******3610',
    cardBrand: 'VISA',
    trxDate: '09-09-2026 15:37',
    paidAt: new Date('2026-09-09T15:37:00+01:00'),
  },
  {
    oid: 'SAMTTZ6Z9S57D6CD0EFFCC',
    expectAmount: 5000,
    transId: '26252L47D12526277',
    authCode: '119787',
    maskedPan: '485013******3633',
    cardBrand: 'VISA',
    trxDate: '09-09-2026 11:54',
    paidAt: new Date('2026-09-09T11:54:00+01:00'),
  },
]

async function main() {
  const u = new URL(process.env.MONGODB_URL ?? '')
  console.log(`database: ${u.hostname}${u.pathname}`)
  console.log(APPLY ? 'mode: APPLY — writing changes\n' : 'mode: DRY RUN — nothing is written\n')

  for (const rec of RECORDS) {
    const order = await prisma.order.findUnique({ where: { oid: rec.oid } })
    if (!order) {
      console.log(`${rec.oid}  SKIP — no such order`)
      continue
    }
    if (order.amount !== rec.expectAmount) {
      console.log(`${rec.oid}  REFUSED — amount mismatch: order ${mad(order.amount)}, CMI ${mad(rec.expectAmount)}`)
      continue
    }
    if (order.status !== 'PENDING' && order.status !== 'UNDER_RECONCILIATION') {
      console.log(`${rec.oid}  SKIP — already ${order.status}`)
      continue
    }

    console.log(`${rec.oid}  ${mad(order.amount)}  ${order.customerName}`)
    console.log(`   order   ${order.status} -> PAID (cmiStatus PRE, transId ${rec.transId})`)

    if (APPLY) {
      // Same guarded transition markOrderPaid uses: amount must still match and
      // the status must still be unsettled, so a real callback arriving in
      // parallel cannot be overwritten.
      const res = await prisma.order.updateMany({
        where: { oid: rec.oid, amount: rec.expectAmount, status: { in: ['PENDING', 'UNDER_RECONCILIATION'] } },
        data: {
          status: 'PAID',
          cmiStatus: 'PRE',
          paidAt: rec.paidAt,
          transId: rec.transId,
          authCode: rec.authCode,
          maskedPan: rec.maskedPan,
          cardBrand: rec.cardBrand,
          trxDate: rec.trxDate,
          procReturnCode: '00',
        },
      })
      if (res.count === 0) {
        console.log(`   order   LOST RACE — left untouched`)
        continue
      }
    }

    // Fulfilment: confirm the booking and upsert the guest, exactly as
    // fulfillPaidOrder does. Emails are deliberately left out.
    if (order.serviceBookingId) {
      const b = await prisma.serviceBooking.findUnique({ where: { id: order.serviceBookingId } })
      console.log(`   booking ${b?.status ?? '?'} -> Confirmed  (${b?.itemName ?? '?'} · ${b?.date ?? '?'})`)
      if (APPLY) {
        await prisma.serviceBooking.updateMany({ where: { id: order.serviceBookingId }, data: { status: 'Confirmed' } })
      }
    }
    if (order.reservationId) {
      const r = await prisma.reservation.findUnique({ where: { id: order.reservationId } })
      console.log(`   stay    ${r?.status ?? '?'} -> Confirmed  (${r?.suite ?? '?'})`)
      if (APPLY) {
        await prisma.reservation.updateMany({ where: { id: order.reservationId }, data: { status: 'Confirmed' } })
      }
    }

    if (order.customerEmail) {
      const guest = await prisma.guest.findFirst({ where: { email: order.customerEmail } })
      console.log(`   guest   ${guest ? `stays ${guest.stays} -> ${guest.stays + 1}` : `create ${order.customerEmail}`}`)
      if (APPLY) {
        if (guest) {
          await prisma.guest.update({ where: { id: guest.id }, data: { stays: guest.stays + 1 } })
        } else {
          await prisma.guest.create({
            data: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone, stays: 1 },
          })
        }
      }
    }

    // Claim fulfilment so a late genuine callback cannot run it a second time.
    console.log(`   fulfilledAt ${APPLY ? 'set' : 'would be set'} (no email sent)`)
    if (APPLY) {
      await prisma.order.update({ where: { id: order.id }, data: { fulfilledAt: new Date() } })
    }
    console.log()
  }

  if (!APPLY) console.log('Dry run only. Re-run with --apply to write.')
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
