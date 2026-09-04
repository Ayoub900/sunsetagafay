// One-off migration for the day-pass / transfer payment feature.
//
// `Order.bookingRef` replaced the unique indexes on `Order.reservationId` /
// `Order.serviceBookingId` as the "one order per booking" key. It has to be a
// field that is always set: MongoDB indexes a missing/null value as a value, so
// a unique index on an optional foreign key admits only ONE order without it —
// which broke as soon as a second day-pass or transfer order was created.
//
// Run this ONCE per database, BEFORE `npx prisma db push` (the new unique index
// on `bookingRef` cannot be created while old orders still lack the field):
//
//   node --env-file=.env scripts/migrate-order-booking-ref.mjs
//
// Idempotent: re-running it changes nothing. Everything goes through raw
// commands so it works even though the Prisma client now expects a field the
// old documents do not have yet.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry-run')

async function main() {
  // 1) Backfill bookingRef on every order that predates the field.
  const { cursor } = await prisma.$runCommandRaw({
    find: 'Order',
    filter: { $or: [{ bookingRef: { $exists: false } }, { bookingRef: null }] },
    projection: { _id: 1, oid: 1, reservationId: 1, serviceBookingId: 1 },
  })
  const stale = cursor.firstBatch

  let backfilled = 0
  for (const o of stale) {
    const ref = o.reservationId
      ? `res:${idOf(o.reservationId)}`
      : o.serviceBookingId
        ? `svc:${idOf(o.serviceBookingId)}`
        // Neither link (should not happen): fall back to the CMI order id, which
        // is itself unique, so the order stays readable instead of blocking.
        : `oid:${o.oid}`
    if (!DRY) {
      await prisma.$runCommandRaw({
        update: 'Order',
        updates: [{ q: { _id: o._id }, u: { $set: { bookingRef: ref } } }],
      })
    }
    backfilled++
  }
  console.log(`${DRY ? '[dry-run] would backfill' : 'backfilled'} bookingRef on ${backfilled} order(s)`)

  // 2) Drop the old unique indexes on the optional foreign keys. They are what
  //    limited the collection to a single order without a reservation.
  const { cursor: idxCursor } = await prisma.$runCommandRaw({ listIndexes: 'Order' })
  const names = idxCursor.firstBatch.map(i => i.name)
  for (const name of ['Order_reservationId_key', 'Order_serviceBookingId_key']) {
    if (!names.includes(name)) continue
    if (!DRY) await prisma.$runCommandRaw({ dropIndexes: 'Order', index: name })
    console.log(`${DRY ? '[dry-run] would drop' : 'dropped'} index ${name}`)
  }

  // 3) Create the unique index bookingRef relies on. `prisma db push` would do
  //    this too; doing it here keeps the migration self-contained.
  if (!names.includes('Order_bookingRef_key')) {
    if (!DRY) {
      await prisma.$runCommandRaw({
        createIndexes: 'Order',
        indexes: [{ key: { bookingRef: 1 }, name: 'Order_bookingRef_key', unique: true }],
      })
    }
    console.log(`${DRY ? '[dry-run] would create' : 'created'} unique index Order_bookingRef_key`)
  } else {
    console.log('unique index Order_bookingRef_key already present')
  }
}

// Raw reads return an ObjectId as { $oid: "..." }.
function idOf(v) {
  return typeof v === 'string' ? v : v.$oid
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
