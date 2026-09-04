// Gives every day pass and transfer an online price in MAD, so it can be booked
// by card. Day passes and transfers are card-only: an item with
// `priceMadCents = 0` cannot be booked at all, so this has to be run once on any
// database seeded before online payment existed.
//
//   node --env-file=.env scripts/set-service-mad-prices.mjs            # apply
//   node --env-file=.env scripts/set-service-mad-prices.mjs --dry-run  # preview
//
// The amount is read from the item's own € display price at 1 € = 10 MAD — the
// same conversion the suites' online prices use. Children pay the adult price
// until a reduced child price is entered in the admin.
//
// Only items still at 0 are touched, so prices set by hand in the admin are
// never overwritten and re-running changes nothing. Pass --rate <n> to use a
// different € → MAD rate, or set the real prices in
// *Admin → Day Passes / Transfers → Online payment*.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry-run')
const rateArg = process.argv.indexOf('--rate')
const RATE = rateArg > -1 ? Number(process.argv[rateArg + 1]) : 10

if (!Number.isFinite(RATE) || RATE <= 0) {
  console.error('--rate must be a positive number of MAD per €')
  process.exit(1)
}

// "55,00" / "€120 / vehicle" / "From €180" -> MAD centimes. 0 when no amount can
// be read: better to leave the item unsellable than to invent a charge.
function toMadCents(label) {
  const m = String(label ?? '').replace(/\s/g, '').match(/(\d+(?:[.,]\d{1,2})?)/)
  if (!m) return 0
  const eur = parseFloat(m[1].replace(',', '.'))
  if (!Number.isFinite(eur) || eur <= 0) return 0
  return Math.round(eur * RATE * 100)
}

const mad = cents => `${(cents / 100).toLocaleString('fr-FR')} MAD`

async function main() {
  console.log(`rate: 1 € = ${RATE} MAD${DRY ? ' (dry run)' : ''}\n`)

  const passes = await prisma.dayPass.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, slug: true, price: true, currency: true, priceMadCents: true, childPriceMadCents: true },
  })
  for (const p of passes) {
    if (p.priceMadCents > 0) {
      console.log(`day pass  ${p.slug.padEnd(24)} already priced at ${mad(p.priceMadCents)} — left alone`)
      continue
    }
    const cents = toMadCents(p.price)
    if (cents === 0) {
      console.log(`day pass  ${p.slug.padEnd(24)} no € amount in "${p.price}" — SET IT IN THE ADMIN`)
      continue
    }
    if (!DRY) {
      await prisma.dayPass.update({
        where: { id: p.id },
        data: {
          priceMadCents: cents,
          // Only fill the child price if it is unset; a deliberate 0 (children
          // free) entered in the admin would show as 0 too, but this only runs
          // on items that were never priced at all.
          childPriceMadCents: p.childPriceMadCents > 0 ? p.childPriceMadCents : cents,
        },
      })
    }
    console.log(`day pass  ${p.slug.padEnd(24)} ${p.currency || '€'}${p.price} -> ${mad(cents)} per adult and per child`)
  }

  const transfers = await prisma.transfer.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, slug: true, price: true, priceMadCents: true },
  })
  for (const t of transfers) {
    if (t.priceMadCents > 0) {
      console.log(`transfer  ${t.slug.padEnd(24)} already priced at ${mad(t.priceMadCents)} — left alone`)
      continue
    }
    const cents = toMadCents(t.price)
    if (cents === 0) {
      console.log(`transfer  ${t.slug.padEnd(24)} no € amount in "${t.price}" — SET IT IN THE ADMIN`)
      continue
    }
    if (!DRY) {
      await prisma.transfer.update({ where: { id: t.id }, data: { priceMadCents: cents } })
    }
    console.log(`transfer  ${t.slug.padEnd(24)} ${t.price} -> ${mad(cents)} per vehicle`)
  }

  console.log('\nConfirm these in Admin → Day Passes / Transfers → Online payment.')
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
