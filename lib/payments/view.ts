import type { Order, Reservation, ServiceBooking } from '@prisma/client'
import { formatMinorUnits } from '@/lib/cmi/util'

// One place that answers "did this guest actually pay?" — for a day pass, a
// transfer and a room stay alike, so the admin screens can never disagree with
// each other.
//
// The money is authoritative on the Order (set by the CMI host-to-host
// callback), never on the booking: a booking's own status is only a mirror that
// fulfilment flips to Confirmed once an order is PAID. When the two disagree,
// that is itself worth showing — see the `attention` builders below.

export type PayState = 'PAID' | 'AWAITING' | 'UNPAID' | 'OFFLINE' | 'CHECK' | 'REFUNDED' | 'CANCELLED'

export type PayTone = 'paid' | 'warn' | 'unpaid' | 'alert' | 'info' | 'muted'

// A PENDING order younger than this is a checkout still in flight: the guest is
// most likely on the CMI page right now. Older than that and nobody is coming
// back — the same window the Payments screen uses to pick orders to reconcile.
const IN_FLIGHT_MS = 60 * 60_000

export const PAY_META: Record<PayState, { label: string; tone: PayTone; hint: string }> = {
  PAID:      { label: 'Paid',            tone: 'paid',   hint: 'Card charged and settled' },
  AWAITING:  { label: 'Paying now',      tone: 'warn',   hint: 'Checkout started in the last hour' },
  UNPAID:    { label: 'Not paid',        tone: 'unpaid', hint: 'Card payment started but no money received' },
  OFFLINE:   { label: 'Not paid online', tone: 'muted',  hint: 'Nothing went through the card gateway' },
  CHECK:     { label: 'Needs checking',  tone: 'alert',  hint: 'Verify in the CMI Merchant Center' },
  REFUNDED:  { label: 'Refunded',        tone: 'info',   hint: 'Money returned to the card' },
  CANCELLED: { label: 'Cancelled',       tone: 'muted',  hint: 'Booking cancelled' },
}

/**
 * The payment state of one order.
 *
 * `noOrder` is what to report when there is no order at all, and the two
 * screens genuinely mean different things by it. A ServiceBooking only ever
 * comes into existence through the online checkout, so no order there means the
 * guest walked away without paying — UNPAID. A Reservation can just as easily
 * have been typed in by the desk or taken over the phone, so no order there
 * says nothing about whether money changed hands — OFFLINE, not an accusation.
 */
function stateOf(
  order: Order | null,
  cancelled: boolean,
  now: number,
  noOrder: PayState,
): PayState {
  if (order?.status === 'PAID') return 'PAID'
  if (order?.status === 'REFUNDED' || order?.status === 'PARTIALLY_REFUNDED') return 'REFUNDED'
  if (cancelled || order?.status === 'CANCELLED') return 'CANCELLED'
  if (order?.status === 'UNDER_RECONCILIATION') return 'CHECK'
  if (order && now - new Date(order.createdAt).getTime() < IN_FLIGHT_MS) return 'AWAITING'
  return order ? 'UNPAID' : noOrder
}

export function payStateOf(booking: ServiceBooking, order: Order | null, now = Date.now()): PayState {
  return stateOf(order, booking.status === 'Cancelled', now, 'UNPAID')
}

// The booking's own status is a mirror of the order. A row where the mirror is
// wrong needs a human: either fulfilment did not run, or a Confirmed booking is
// sitting there with no money behind it.
function bookingAttention(booking: ServiceBooking, state: PayState): string | null {
  if (state === 'PAID' && booking.status !== 'Confirmed') {
    return 'Paid, but the booking never flipped to Confirmed — fulfilment did not run.'
  }
  if (booking.status === 'Confirmed' && state !== 'PAID' && state !== 'REFUNDED') {
    return 'Marked Confirmed with no settled payment — check before letting the guest in.'
  }
  if (state === 'CHECK') {
    return 'CMI could not confirm this payment. Verify it in the Merchant Center.'
  }
  return null
}

// What every payment-aware row shares, and all the summary tiles need.
export interface PayFacts {
  pay: PayState
  amountMinor: number
  attention: string | null
}

export interface BookingRow extends PayFacts {
  id: string
  kind: 'DAY_PASS' | 'TRANSFER'
  kindLabel: string
  itemName: string
  date: string          // YYYY-MM-DD: sortable and comparable as-is
  time: string
  whenLabel: string
  people: string
  guestName: string
  email: string
  phone: string
  route: string
  notes: string
  // `amountLabel` is what the card was actually charged when there is an order,
  // otherwise the quote snapshot taken when the booking was made.
  amountLabel: string
  amountMinor: number
  quotedOnly: boolean
  pay: PayState
  payHint: string
  oid: string
  paidAtLabel: string
  cardLabel: string
  bookingStatus: string
  attention: string | null
  createdAtLabel: string
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function fmtDay(iso: string) {
  // Midday avoids the date sliding a day either way across timezones.
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

/** Flatten a booking + its order into everything the admin screens render. */
export function toRow(b: ServiceBooking & { orders: Order[] }, now = Date.now()): BookingRow {
  const order = b.orders[0] ?? null
  const state = payStateOf(b, order, now)
  const isTransfer = b.kind === 'TRANSFER'

  return {
    id: b.id,
    kind: b.kind as 'DAY_PASS' | 'TRANSFER',
    kindLabel: isTransfer ? 'Transfer' : 'Day pass',
    itemName: b.itemName,
    date: b.date,
    time: b.time,
    whenLabel: `${fmtDay(b.date)}${b.time ? ` · ${b.time}` : ''}`,
    people: [
      `${b.adults} ${isTransfer ? 'pax' : b.adults === 1 ? 'adult' : 'adults'}`,
      b.children > 0 ? `${b.children} ${b.children === 1 ? 'child' : 'children'}` : '',
    ].filter(Boolean).join(' · '),
    guestName: b.guestName,
    email: b.email,
    phone: b.phone,
    route: [b.pickup, b.dropoff].filter(Boolean).join(' → '),
    notes: b.notes,
    amountLabel: order ? `${formatMinorUnits(order.amount)} MAD` : (b.total || '—'),
    amountMinor: order?.amount ?? 0,
    quotedOnly: !order,
    pay: state,
    payHint: order
      ? PAY_META[state].hint
      : state === 'CANCELLED' ? PAY_META.CANCELLED.hint : 'Never reached the payment page',
    oid: order?.oid ?? '',
    paidAtLabel: order?.paidAt ? fmtDateTime(order.paidAt) : '',
    cardLabel: [order?.cardBrand, order?.maskedPan].filter(Boolean).join(' '),
    bookingStatus: b.status,
    attention: bookingAttention(b, state),
    createdAtLabel: fmtDateTime(b.createdAt),
  }
}

// ─── Room stays ─────────────────────────────────────────────────────────────

// A reservation's status is set by hand as often as by fulfilment — the desk
// confirms phone bookings itself — so only the one direction is a real fault:
// money settled that the reservation never reflected.
function reservationAttention(r: Reservation, state: PayState): string | null {
  const settled = ['Confirmed', 'In-house', 'Departing', 'Completed']
  if (state === 'PAID' && !settled.includes(r.status)) {
    return `Paid, but the reservation is still ${r.status} — fulfilment did not run.`
  }
  if (state === 'CHECK') {
    return 'CMI could not confirm this payment. Verify it in the Merchant Center.'
  }
  return null
}

export interface ReservationRow extends PayFacts {
  id: string
  guestName: string
  email: string
  phone: string
  suite: string
  // Free text on the model ("14 May 2026"), so these are shown, never compared.
  checkIn: string
  checkOut: string
  stayLabel: string
  nights: number
  guests: number
  occupancy: string
  // What the card was charged when there is an order, otherwise the quote typed
  // on the reservation — which may be in euros, hence no MAD assumption.
  amountLabel: string
  quotedOnly: boolean
  payHint: string
  oid: string
  paidAtLabel: string
  cardLabel: string
  status: string
  notes: string
  createdAtLabel: string
}

/** Flatten a reservation + its order into everything the admin table renders. */
export function toReservationRow(r: Reservation & { orders: Order[] }, now = Date.now()): ReservationRow {
  const order = r.orders[0] ?? null
  const state = stateOf(order, r.status === 'Cancelled', now, 'OFFLINE')

  return {
    id: r.id,
    guestName: r.guestName,
    email: r.email,
    phone: r.phone,
    suite: r.suite,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    stayLabel: `${r.checkIn} → ${r.checkOut}`,
    nights: r.nights,
    guests: r.guests,
    occupancy: `${r.nights} ${r.nights === 1 ? 'night' : 'nights'} · ${r.guests} ${r.guests === 1 ? 'guest' : 'guests'}`,
    amountLabel: order ? `${formatMinorUnits(order.amount)} MAD` : (r.total || '—'),
    amountMinor: order?.amount ?? 0,
    quotedOnly: !order,
    pay: state,
    payHint: PAY_META[state].hint,
    oid: order?.oid ?? '',
    paidAtLabel: order?.paidAt ? fmtDateTime(order.paidAt) : '',
    cardLabel: [order?.cardBrand, order?.maskedPan].filter(Boolean).join(' '),
    status: r.status,
    notes: r.notes,
    attention: reservationAttention(r, state),
    createdAtLabel: fmtDateTime(r.createdAt),
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface PayTotals {
  paid: number
  paidMinor: number
  awaiting: number
  unpaid: number
  offline: number
  check: number
  refunded: number
  cancelled: number
  attention: number
}

export function totalsOf(rows: PayFacts[]): PayTotals {
  const t: PayTotals = { paid: 0, paidMinor: 0, awaiting: 0, unpaid: 0, offline: 0, check: 0, refunded: 0, cancelled: 0, attention: 0 }
  for (const r of rows) {
    if (r.pay === 'PAID') { t.paid++; t.paidMinor += r.amountMinor }
    else if (r.pay === 'AWAITING') t.awaiting++
    else if (r.pay === 'UNPAID') t.unpaid++
    else if (r.pay === 'OFFLINE') t.offline++
    else if (r.pay === 'CHECK') t.check++
    else if (r.pay === 'REFUNDED') t.refunded++
    else if (r.pay === 'CANCELLED') t.cancelled++
    if (r.attention) t.attention++
  }
  return t
}

/** "12 480.00 MAD" from integer centimes, for the collected-money tile. */
export function madTotal(minor: number): string {
  const [major, cents] = formatMinorUnits(minor).split('.')
  return `${major.replace(/\B(?=(\d{3})+$)/g, ' ')}.${cents} MAD`
}
