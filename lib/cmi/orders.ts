import 'server-only'
import { createHash } from 'node:crypto'
import { Prisma, type Order, type Reservation } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { newOid, parseAmountToMinor } from './util'

// ─────────────────────────────────────────────────────────────────────────────
// Order lifecycle + callback persistence. Every status transition here is a
// single conditional DB write (updateMany with a status guard) so that no
// out-of-order, duplicate, or malicious request can downgrade a finalized order.
// ─────────────────────────────────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NOT_CHARGEABLE' | 'MISSING_EMAIL' = 'NOT_CHARGEABLE',
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

/**
 * Create the PENDING order for a reservation, or load and reuse the existing
 * unpaid order (keeping its oid) for a retry. A new oid is minted only for a
 * genuinely new order. Every write is conditional on the order still being
 * PENDING so a concurrently-arriving success callback can never be clobbered.
 */
export async function createOrLoadOrderForReservation(
  reservationId: string,
  lang: string,
): Promise<OrderResult> {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!reservation) throw new PaymentError('Reservation not found', 'NOT_FOUND')
  if (!reservation.email || !reservation.email.trim()) {
    throw new PaymentError('A customer email is required to take payment.', 'MISSING_EMAIL')
  }

  const charge = await computeReservationCharge(reservation)
  const refreshData = {
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
  }

  const existing = await prisma.order.findUnique({ where: { reservationId } })
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
      data: { oid: newOid(), status: 'PENDING', reservationId, ...refreshData },
    })
    return { order, reused: false, showStatusInstead: false }
  } catch (err) {
    // Unique-index race: another request created the order for this
    // reservation concurrently. Load and reuse it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const order = await prisma.order.findUnique({ where: { reservationId } })
      if (order) {
        return { order, reused: true, showStatusInstead: order.status !== 'PENDING' }
      }
    }
    throw err
  }
}

export function getOrderByOid(oid: string) {
  return prisma.order.findUnique({ where: { oid } })
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

  // TODO: send the confirmation email here (async, after response). Left as a
  // hook so a slow mailer never delays the callback response to CMI.
}
