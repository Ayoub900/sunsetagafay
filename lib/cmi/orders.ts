import 'server-only'
import { createHash } from 'node:crypto'
import { Prisma, type Order, type Reservation, type ServiceBooking } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isObjectId, newOid, parseAmountToMinor } from './util'
import { sendPaymentEmails } from '@/lib/email/payment'
import { isServiceBlockedOnDate, isSuiteBlocked } from '@/lib/db'
import { logCallback } from './observability'
import {
  dayPassAmountMadCents,
  transferAmountMadCents,
  MAX_CHARGE_MAD_CENTS,
} from './pricing'

// ─────────────────────────────────────────────────────────────────────────────
// Order lifecycle + callback persistence. Every status transition here is a
// single conditional DB write (updateMany with a status guard) so that no
// out-of-order, duplicate, or malicious request can downgrade a finalized order.
// ─────────────────────────────────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NOT_CHARGEABLE' | 'MISSING_EMAIL' | 'DATE_BLOCKED' = 'NOT_CHARGEABLE',
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

const FINALIZED: Order['status'][] = ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED']


// ── Pricing ──────────────────────────────────────────────────────────────────

export interface Charge {
  amountMad: number // MAD minor units (centimes) — authoritative
  displayAmount: number | null // display currency minor units (e.g. EUR cents)
  displayCurrency: string | null // ISO numeric of display currency
  displaySymbol: string | null
  description: string
}

/**
 * Compute the amount to charge, server-side only, from the reservation's suite.
 * The `rateMadCents` on the suite is the single source of truth; nothing from
 * the browser is trusted. Throws if the suite can't be charged online.
 */
export async function computeReservationCharge(reservation: Reservation): Promise<Charge> {
  const suite = await prisma.suite.findFirst({ where: { nameEn: reservation.suite } })
  if (!suite || suite.rateMadCents <= 0) {
    throw new PaymentError('This room is not available for online payment.', 'NOT_CHARGEABLE')
  }
  const nights = Math.max(1, reservation.nights)
  const amountMad = suite.rateMadCents * nights

  // Optional display currency (EUR) parsed from the marketing rate string, used
  // only to send amountCur/symbolCur — never as the settled amount.
  let displayAmount: number | null = null
  let displayCurrency: string | null = null
  let displaySymbol: string | null = null
  const rateNum = parseFloat((suite.rate || '').replace(/[^0-9.]/g, ''))
  if (rateNum > 0 && (suite.rate || '').includes('€')) {
    displayAmount = Math.round(rateNum * nights * 100)
    displayCurrency = '978' // EUR (ISO numeric)
    // The PDF's symbolCur examples are ISO alpha codes ("EUR", "USD"), not
    // glyphs — send the code, not "€".
    displaySymbol = 'EUR'
  }

  const description = `${suite.nameEn} · ${reservation.checkIn} → ${reservation.checkOut} · ${nights} night${nights === 1 ? '' : 's'}`
  return { amountMad, displayAmount, displayCurrency, displaySymbol, description }
}

/**
 * Compute the amount to charge for a day pass or a transfer, server-side only,
 * from the DayPass / Transfer row the booking points at. `priceMadCents` there
 * is the single source of truth; the guest counts on the booking are the only
 * customer-supplied input and they are re-validated on the way in.
 *
 * No display currency is sent for services: their `price` strings are marketing
 * copy ("From €180", "55,00") rather than an exact convertible amount, so
 * showing one on the CMI page would risk quoting a figure we are not charging.
 */
export async function computeServiceBookingCharge(booking: ServiceBooking): Promise<Charge> {
  const adults = Math.max(0, booking.adults)
  const children = Math.max(0, booking.children)
  const when = [booking.date, booking.time].filter(Boolean).join(' ')

  let amountMad: number
  let description: string

  if (booking.kind === 'DAY_PASS') {
    const pass = await prisma.dayPass.findUnique({ where: { id: booking.itemId } })
    if (!pass || !pass.active || pass.priceMadCents <= 0) {
      throw new PaymentError('This day pass is not available for online payment.', 'NOT_CHARGEABLE')
    }
    amountMad = dayPassAmountMadCents(adults, children, pass.priceMadCents, pass.childPriceMadCents)
    const guests = [
      `${adults} adult${adults === 1 ? '' : 's'}`,
      children > 0 ? `${children} child${children === 1 ? '' : 'ren'}` : '',
    ]
      .filter(Boolean)
      .join(' + ')
    description = `${pass.nameEn} · ${when} · ${guests}`
  } else {
    const transfer = await prisma.transfer.findUnique({ where: { id: booking.itemId } })
    if (!transfer || !transfer.active || transfer.priceMadCents <= 0) {
      throw new PaymentError('This transfer is not available for online payment.', 'NOT_CHARGEABLE')
    }
    amountMad = transferAmountMadCents(transfer.priceMadCents)
    const people = adults + children
    description = `${transfer.nameEn} · ${when} · ${people} passenger${people === 1 ? '' : 's'}`
  }

  if (amountMad <= 0) {
    throw new PaymentError('This booking has no amount to charge.', 'NOT_CHARGEABLE')
  }
  if (amountMad > MAX_CHARGE_MAD_CENTS) {
    // A mis-keyed price or an absurd guest count: refuse rather than send it.
    throw new PaymentError('This booking is too large to pay online. Please contact us.', 'NOT_CHARGEABLE')
  }

  return {
    amountMad,
    displayAmount: null,
    displayCurrency: null,
    displaySymbol: null,
    description: description.slice(0, 200),
  }
}

// ── Order create / load ──────────────────────────────────────────────────────

export interface OrderResult {
  order: Order
  reused: boolean
  /**
   * True when payment must NOT be (re-)initiated: the order is finalized
   * (PAID/REFUNDED/CANCELLED/…) or UNDER_RECONCILIATION (a payment may already
   * exist on the CMI side — the customer must never be asked to pay again
   * until reconciliation resolves it). The caller shows the status page.
   */
  showStatusInstead: boolean
}

// What the Order points at: a room stay or a day-pass/transfer booking. Exactly
// one of the two foreign keys is ever set; `bookingRef` mirrors it as the
// always-set unique key the "one order per booking" guarantee rests on (a
// unique index on an optional key would only admit one null in MongoDB).
type OrderLink = { reservationId: string } | { serviceBookingId: string }

function bookingRefFor(link: OrderLink): string {
  return 'reservationId' in link ? `res:${link.reservationId}` : `svc:${link.serviceBookingId}`
}

// The server-computed snapshot refreshed onto the order at every (re-)initiate.
interface OrderSnapshot {
  amount: number
  currency: string
  displayAmount: number | null
  displayCurrency: string | null
  displaySymbol: string | null
  description: string
  customerName: string
  customerEmail: string
  customerPhone: string
  lang: string
}

/**
 * Create the PENDING order for what is being bought, or load and reuse the
 * existing unpaid order (keeping its oid) for a retry. A new oid is minted only
 * for a genuinely new order. Every write is conditional on the order still being
 * PENDING so a concurrently-arriving success callback can never be clobbered.
 */
async function createOrLoadOrder(link: OrderLink, refreshData: OrderSnapshot): Promise<OrderResult> {
  const bookingRef = bookingRefFor(link)
  const existing = await prisma.order.findUnique({ where: { bookingRef } })
  if (existing) {
    if (existing.status !== 'PENDING') {
      // Finalized or UNDER_RECONCILIATION — never re-initiate, never downgrade.
      return { order: existing, reused: true, showStatusInstead: true }
    }
    // Retry of an unpaid order: keep the SAME oid, refresh the server-computed
    // amount + customer snapshot — but only if it is STILL pending (guards the
    // race where a late success callback flips it to PAID mid-request).
    const res = await prisma.order.updateMany({
      where: { id: existing.id, status: 'PENDING' },
      data: refreshData,
    })
    const order = await prisma.order.findUnique({ where: { id: existing.id } })
    if (!order) throw new PaymentError('Order not found', 'NOT_FOUND')
    if (res.count === 0 || order.status !== 'PENDING') {
      return { order, reused: true, showStatusInstead: true }
    }
    return { order, reused: true, showStatusInstead: false }
  }

  try {
    const order = await prisma.order.create({
      data: { oid: newOid(), status: 'PENDING', bookingRef, ...link, ...refreshData },
    })
    return { order, reused: false, showStatusInstead: false }
  } catch (err) {
    // Unique-index race: another request created the order for this booking
    // concurrently. Load and reuse it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const order = await prisma.order.findUnique({ where: { bookingRef } })
      if (order) {
        return { order, reused: true, showStatusInstead: order.status !== 'PENDING' }
      }
    }
    throw err
  }
}

/** Order for a room stay. */
export async function createOrLoadOrderForReservation(
  reservationId: string,
  lang: string,
): Promise<OrderResult> {
  if (!isObjectId(reservationId)) throw new PaymentError('Reservation not found', 'NOT_FOUND')
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!reservation) throw new PaymentError('Reservation not found', 'NOT_FOUND')
  if (!reservation.email || !reservation.email.trim()) {
    throw new PaymentError('A customer email is required to take payment.', 'MISSING_EMAIL')
  }

  // A closure added after the reservation was taken must not be payable. The
  // booking endpoints check this too; re-checking here closes the window
  // between booking and payment.
  if (await isSuiteBlocked(reservation.suite, reservation.checkIn, reservation.checkOut)) {
    throw new PaymentError('These dates are no longer available.', 'DATE_BLOCKED')
  }

  const charge = await computeReservationCharge(reservation)
  return createOrLoadOrder(
    { reservationId },
    {
      amount: charge.amountMad,
      currency: '504',
      displayAmount: charge.displayAmount,
      displayCurrency: charge.displayCurrency,
      displaySymbol: charge.displaySymbol,
      description: charge.description,
      customerName: reservation.guestName,
      customerEmail: reservation.email.trim(),
      customerPhone: reservation.phone,
      lang,
    },
  )
}

/** Order for a day pass or a transfer. */
export async function createOrLoadOrderForServiceBooking(
  serviceBookingId: string,
  lang: string,
): Promise<OrderResult> {
  if (!isObjectId(serviceBookingId)) throw new PaymentError('Booking not found', 'NOT_FOUND')
  const booking = await prisma.serviceBooking.findUnique({ where: { id: serviceBookingId } })
  if (!booking) throw new PaymentError('Booking not found', 'NOT_FOUND')
  if (!booking.email || !booking.email.trim()) {
    throw new PaymentError('A customer email is required to take payment.', 'MISSING_EMAIL')
  }

  const serviceType = booking.kind === 'TRANSFER' ? 'transfer' : 'day-pass'
  if (await isServiceBlockedOnDate(serviceType, booking.itemId, booking.date)) {
    throw new PaymentError('This date is no longer available.', 'DATE_BLOCKED')
  }

  const charge = await computeServiceBookingCharge(booking)
  return createOrLoadOrder(
    { serviceBookingId },
    {
      amount: charge.amountMad,
      currency: '504',
      displayAmount: charge.displayAmount,
      displayCurrency: charge.displayCurrency,
      displaySymbol: charge.displaySymbol,
      description: charge.description,
      customerName: booking.guestName,
      customerEmail: booking.email.trim(),
      customerPhone: booking.phone,
      lang,
    },
  )
}

export function getOrderByOid(oid: string) {
  return prisma.order.findUnique({ where: { oid } })
}

/**
 * Did the customer come back from CMI claiming success for this order?
 *
 * A PENDING order is ambiguous. Usually payment was simply never attempted —
 * but okUrl bails out before the UNDER_RECONCILIATION transition when the
 * return hash does not verify, which leaves a genuinely paid order sitting at
 * PENDING. Money may already have moved, so such an order must never be shown
 * a "pay now" invitation. The okUrl return is persisted either way, so its
 * presence is the evidence. failUrl rows are deliberately NOT counted: those
 * are declines, and a decline should still offer a retry.
 */
export async function hasClaimedSuccessReturn(orderId: string): Promise<boolean> {
  const n = await prisma.paymentCallback.count({ where: { orderId, channel: 'okurl' } })
  return n > 0
}

// ── Callback field access ────────────────────────────────────────────────────

export type RawParams = Record<string, string>

/** Case-insensitive single-value lookup over received CMI params. */
export function ci(params: RawParams, key: string): string | undefined {
  const target = key.toLowerCase()
  for (const k of Object.keys(params)) {
    if (k.toLowerCase() === target) return params[k]
  }
  return undefined
}

/**
 * Stable idempotency key for a callback: the CMI TransId when present, else a
 * SHA-256 fingerprint of the full payload. Duplicate deliveries collapse to the
 * same key and are rejected by the unique index.
 */
export function computeFingerprint(params: RawParams): string {
  const transId = ci(params, 'TransId')
  if (transId && transId.trim()) return `tx:${transId.trim()}`
  const serialized = JSON.stringify(params, Object.keys(params).sort())
  return 'fp:' + createHash('sha256').update(serialized).digest('hex')
}

// ── Atomic transitions ───────────────────────────────────────────────────────

export interface PaymentData {
  transId?: string
  authCode?: string
  hostRefNum?: string
  acqStan?: string
  maskedPan?: string
  cardBrand?: string
  trxDate?: string
  mdStatus?: string
  txstatus?: string
  procReturnCode?: string
}

/**
 * Atomically move PENDING | UNDER_RECONCILIATION -> PAID for the given oid, but
 * only if the stored amount matches. Returns true only for the first (winning)
 * transition, which is the single moment business fulfillment may run.
 */
export async function markOrderPaid(
  oid: string,
  expectedAmountMinor: number,
  data: PaymentData,
): Promise<boolean> {
  const now = new Date()
  const res = await prisma.order.updateMany({
    where: {
      oid,
      amount: expectedAmountMinor,
      status: { in: ['PENDING', 'UNDER_RECONCILIATION'] },
    },
    data: {
      status: 'PAID',
      // PreAuth succeeded -> pre-authorized in the CMI back office. We record
      // PRE and postAuthRequestedAt; POST is only set after real capture
      // confirmation (status API / back office), never merely because we
      // returned ACTION=POSTAUTH.
      cmiStatus: 'PRE',
      paidAt: now,
      postAuthRequestedAt: now,
      transId: data.transId,
      authCode: data.authCode,
      hostRefNum: data.hostRefNum,
      acqStan: data.acqStan,
      maskedPan: data.maskedPan,
      cardBrand: data.cardBrand,
      trxDate: data.trxDate,
      mdStatus: data.mdStatus,
      txstatus: data.txstatus,
      procReturnCode: data.procReturnCode,
    },
  })
  return res.count > 0
}

/** Atomically move PENDING -> UNDER_RECONCILIATION (okUrl fallback only). */
export async function markOrderUnderReconciliation(oid: string): Promise<boolean> {
  const res = await prisma.order.updateMany({
    where: { oid, status: 'PENDING' },
    data: { status: 'UNDER_RECONCILIATION' },
  })
  return res.count > 0
}

// ── Callback persistence (idempotent) ────────────────────────────────────────

export interface PersistArgs {
  params: RawParams
  channel: 'callback' | 'okurl' | 'failurl'
  orderId?: string | null
  oid: string
  hashValid: boolean
  amountMatched?: boolean | null
  responseSent: string
}

/**
 * Persist a callback/return idempotently. If a record with the same fingerprint
 * already exists (duplicate delivery), does nothing and reports it.
 */
export async function persistCallback(
  args: PersistArgs,
): Promise<{ duplicate: boolean }> {
  const { params } = args
  const fingerprint = computeFingerprint(params) + `:${args.channel}`
  try {
    await prisma.paymentCallback.create({
      data: {
        orderId: args.orderId ?? null,
        oid: args.oid,
        fingerprint,
        transId: ci(params, 'TransId') ?? null,
        channel: args.channel,
        hashValid: args.hashValid,
        amountMatched: args.amountMatched ?? null,
        procReturnCode: ci(params, 'ProcReturnCode') ?? null,
        responseCode: ci(params, 'Response') ?? null,
        mdStatus: ci(params, 'mdStatus') ?? null,
        txstatus: ci(params, 'txstatus') ?? null,
        errCode: ci(params, 'ErrCode') ?? null,
        errMsg: ci(params, 'ErrMsg') ?? null,
        responseSent: args.responseSent,
        raw: params as Prisma.InputJsonValue,
      },
    })
    return { duplicate: false }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { duplicate: true }
    }
    throw err
  }
}

export function extractPaymentData(params: RawParams): PaymentData {
  return {
    transId: ci(params, 'TransId'),
    authCode: ci(params, 'AuthCode'),
    hostRefNum: ci(params, 'HostRefNum'),
    acqStan: ci(params, 'acqStan'),
    maskedPan: ci(params, 'MaskedPan'),
    cardBrand: ci(params, 'EXTRA.CARDBRAND') ?? ci(params, 'cardBrand'),
    trxDate: ci(params, 'EXTRA.TRXDATE') ?? ci(params, 'TRXDATE'),
    mdStatus: ci(params, 'mdStatus'),
    txstatus: ci(params, 'txstatus'),
    procReturnCode: ci(params, 'ProcReturnCode'),
  }
}

/** The received CMI amount as integer minor units, or null if malformed. */
export function receivedAmountMinor(params: RawParams): number | null {
  const raw = ci(params, 'amount')
  return raw ? parseAmountToMinor(raw) : null
}

// ── Async fulfillment (runs after the callback response is sent) ──────────────

/**
 * Business fulfillment for a freshly-paid order: confirm the reservation, upsert
 * the guest record, and (placeholder) send the confirmation email. Guarded by
 * an atomic fulfilledAt stamp so it can never run twice even if invoked twice.
 *
 * This must only be called once, for the winning markOrderPaid transition. The
 * fulfilledAt guard is a second safety net, not the primary gate.
 */
export async function fulfillPaidOrder(orderId: string): Promise<void> {
  // Atomic claim. On MongoDB a plain `fulfilledAt: null` filter does NOT match
  // a missing field (the state before first set), so match both explicitly.
  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: 'PAID',
      OR: [{ fulfilledAt: null }, { fulfilledAt: { isSet: false } }],
    },
    data: { fulfilledAt: new Date() },
  })
  if (claimed.count === 0) return // already fulfilled or not paid

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return

  // Mark the linked reservation as paid/confirmed.
  if (order.reservationId) {
    await prisma.reservation.updateMany({
      where: { id: order.reservationId },
      data: { status: 'Confirmed' },
    })
  }

  // Same for a day pass / transfer booking.
  if (order.serviceBookingId) {
    await prisma.serviceBooking.updateMany({
      where: { id: order.serviceBookingId },
      data: { status: 'Confirmed' },
    })
  }

  // Upsert the guest record (match by email), mirroring the /api/book flow.
  if (order.customerEmail) {
    const existingGuest = await prisma.guest.findFirst({ where: { email: order.customerEmail } })
    if (existingGuest) {
      await prisma.guest.update({
        where: { id: existingGuest.id },
        data: { stays: existingGuest.stays + 1 },
      })
    } else {
      await prisma.guest.create({
        data: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          stays: 1,
        },
      })
    }
  }

  // Confirmation to the guest + notification to the maison. This runs after the
  // response to CMI has been sent, and sendPaymentEmails never throws, so a
  // slow or failing mailer can neither delay nor fail the payment.
  const emails = await sendPaymentEmails(orderId)
  logCallback('emails', { oid: order.oid, customer: emails.customer, admin: emails.admin })
}
