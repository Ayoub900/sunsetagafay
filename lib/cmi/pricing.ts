// Pure price arithmetic for the non-stay services (day passes, transfers).
// Kept free of Prisma and `server-only` so it is unit-testable in isolation.
// Everything is integer MAD minor units (centimes) — never floats, per the
// same rule the rest of the CMI code follows.

/** Hard ceiling on a single online charge (MAD 500 000.00) — a tripwire against
 * a mis-keyed admin price or an absurd guest count reaching the gateway. */
export const MAX_CHARGE_MAD_CENTS = 50_000_000

/**
 * Day pass total: every adult pays the pass price, every child pays the child
 * price (0 when the maison does not charge for children).
 */
export function dayPassAmountMadCents(
  adults: number,
  children: number,
  priceMadCents: number,
  childPriceMadCents: number,
): number {
  const a = Math.max(0, Math.trunc(adults))
  const c = Math.max(0, Math.trunc(children))
  return a * Math.max(0, Math.trunc(priceMadCents)) + c * Math.max(0, Math.trunc(childPriceMadCents))
}

/**
 * Transfer total. The published rate is per vehicle / per trip, so the head
 * count does not multiply it — passengers are captured for the driver, not for
 * the price.
 */
export function transferAmountMadCents(priceMadCents: number): number {
  return Math.max(0, Math.trunc(priceMadCents))
}

/** Human label for an amount in MAD minor units: 110000 -> "1 100 MAD". */
export function formatMadLabel(minor: number): string {
  const major = Math.trunc(Math.max(0, minor) / 100)
  const cents = Math.max(0, minor) % 100
  const grouped = major.toLocaleString('fr-FR').replace(/\u202f/g, ' ')
  return cents === 0
    ? `${grouped} MAD`
    : `${grouped},${String(cents).padStart(2, '0')} MAD`
}
