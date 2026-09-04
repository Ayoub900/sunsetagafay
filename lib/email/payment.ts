import 'server-only'
import type { Order, Reservation, ServiceBooking } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatMinorUnits } from '@/lib/cmi/util'
import { sendEmail } from './client'
import { buildAdminEmail, buildCustomerEmail, type BookingKind, type PaymentEmailData } from './templates'

// Assembles and sends the two emails that follow a settled payment: the guest's
// confirmation/receipt and the maison's notification. Called from
// `fulfillPaidOrder`, which runs once per paid order (guarded by an atomic
// `fulfilledAt` claim) after the response to CMI has been sent.

const LABELS = {
  en: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    nights: 'Nights',
    guests: 'Guests',
    date: 'Date',
    time: 'Start time',
    pickupTime: 'Pickup time',
    passengers: 'Passengers',
    pickup: 'Pickup',
    dropoff: 'Drop-off',
    adults: (n: number) => `${n} adult${n === 1 ? '' : 's'}`,
    children: (n: number) => `${n} child${n === 1 ? '' : 'ren'}`,
    people: (n: number) => `${n} passenger${n === 1 ? '' : 's'}`,
  },
  fr: {
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    nights: 'Nuits',
    guests: 'Personnes',
    date: 'Date',
    time: 'Heure d’arrivée',
    pickupTime: 'Heure de prise en charge',
    passengers: 'Passagers',
    pickup: 'Prise en charge',
    dropoff: 'Destination',
    adults: (n: number) => `${n} adulte${n === 1 ? '' : 's'}`,
    children: (n: number) => `${n} enfant${n === 1 ? '' : 's'}`,
    people: (n: number) => `${n} passager${n === 1 ? '' : 's'}`,
  },
} as const

function publicSiteUrl(): string {
  const raw = process.env.CMI_BASE_URL?.trim().replace(/\/+$/, '')
  if (raw && /^https?:\/\//.test(raw)) return raw
  return 'https://sunsetagafay.com'
}

/** Short human reference — the same one the guest saw when booking. */
export function bookingReference(id: string): string {
  return `SA-${id.slice(-6).toUpperCase()}`
}

function stayRows(r: Reservation, lang: 'en' | 'fr'): [string, string][] {
  const l = LABELS[lang]
  return [
    [l.checkIn, r.checkIn],
    [l.checkOut, r.checkOut],
    [l.nights, String(r.nights)],
    [l.guests, String(r.guests)],
  ]
}

function serviceRows(b: ServiceBooking, lang: 'en' | 'fr'): [string, string][] {
  const l = LABELS[lang]
  const isTransfer = b.kind === 'TRANSFER'
  const people = isTransfer
    ? [l.people(b.adults), b.children > 0 ? l.children(b.children) : ''].filter(Boolean).join(' + ')
    : [l.adults(b.adults), b.children > 0 ? l.children(b.children) : ''].filter(Boolean).join(' + ')

  const rows: [string, string][] = [
    [l.date, b.date],
    [isTransfer ? l.pickupTime : l.time, b.time],
    [isTransfer ? l.passengers : l.guests, people],
  ]
  if (isTransfer) {
    rows.push([l.pickup, b.pickup])
    rows.push([l.dropoff, b.dropoff])
  }
  return rows
}

function paymentRows(order: Order): [string, string][] {
  return [
    ['Card', [order.cardBrand, order.maskedPan].filter(Boolean).join(' ')],
    ['Transaction', order.transId ?? ''],
    ['Auth code', order.authCode ?? ''],
    ['Paid at', order.paidAt ? order.paidAt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : ''],
  ]
}

interface Assembled {
  data: PaymentEmailData
  /** Nothing to email when the order links to no booking at all. */
  ok: boolean
}

async function assemble(orderId: string): Promise<Assembled | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { reservation: true, serviceBooking: true },
  })
  if (!order) return null

  const lang: 'en' | 'fr' = order.lang === 'fr' ? 'fr' : 'en'
  const base: Omit<PaymentEmailData, 'kind' | 'itemName' | 'reference' | 'rows' | 'notes'> = {
    lang,
    oid: order.oid,
    amountLabel: `${formatMinorUnits(order.amount)} MAD`,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    adminRows: paymentRows(order),
    siteUrl: publicSiteUrl(),
  }

  if (order.reservation) {
    const r = order.reservation
    return {
      ok: true,
      data: {
        ...base,
        kind: 'stay',
        itemName: r.suite,
        reference: bookingReference(r.id),
        rows: stayRows(r, lang),
        notes: r.notes,
      },
    }
  }

  if (order.serviceBooking) {
    const b = order.serviceBooking
    const kind: BookingKind = b.kind === 'TRANSFER' ? 'transfer' : 'day-pass'
    return {
      ok: true,
      data: {
        ...base,
        kind,
        itemName: b.itemName,
        reference: bookingReference(b.id),
        rows: serviceRows(b, lang),
        notes: b.notes,
      },
    }
  }

  // An order with neither link: fall back to the description so the maison is
  // still told that money arrived.
  return {
    ok: false,
    data: {
      ...base,
      kind: 'stay',
      itemName: order.description || order.oid,
      reference: bookingReference(order.id),
      rows: [],
      notes: '',
    },
  }
}

export interface PaymentEmailOutcome {
  customer: boolean
  admin: boolean
}

/**
 * Send the guest's confirmation and the maison's notification for a paid order.
 * Never throws: a mailer problem must not affect the payment flow. Returns
 * which of the two went out so the caller can log it.
 */
export async function sendPaymentEmails(orderId: string): Promise<PaymentEmailOutcome> {
  const assembled = await assemble(orderId)
  if (!assembled) return { customer: false, admin: false }
  const { data } = assembled

  const customer = buildCustomerEmail(data)
  const admin = buildAdminEmail(data)

  // Both are attempted independently: the maison must still be told about the
  // booking even if the guest's address bounces, and vice versa.
  const [customerResult, adminResult] = await Promise.all([
    data.customerEmail
      ? sendEmail({
          to: data.customerEmail,
          subject: customer.subject,
          html: customer.html,
          text: customer.text,
          tag: `customer-confirmation:${data.oid}`,
        })
      : Promise.resolve({ sent: false }),
    sendEmail({
      to: process.env.EMAIL_ADMIN_TO?.trim() || 'info@sunsetagafay.com',
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      // Replies from the maison go straight to the guest.
      replyTo: data.customerEmail || undefined,
      tag: `admin-notification:${data.oid}`,
    }),
  ])

  return { customer: customerResult.sent, admin: adminResult.sent }
}
