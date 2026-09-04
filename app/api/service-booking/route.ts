import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isServiceBlockedOnDate } from '@/lib/db'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'
import {
  dayPassAmountMadCents,
  formatMadLabel,
  transferAmountMadCents,
} from '@/lib/cmi/pricing'
import {
  email,
  intInRange,
  isoDate,
  phone,
  readJsonBody,
  str,
  ValidationError,
} from '@/lib/validation'

// Creates the booking for a day pass or a transfer, then hands the browser a
// booking id it POSTs to /api/payment/initiate. The amounts returned here are
// for display only: /api/payment/initiate recomputes the charge from the
// DayPass / Transfer row and never trusts anything from the client.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`service-book:${ip}`, 10, 10 * 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  try {
    const body = await readJsonBody(req)

    const kindParam = str(body.kind, { field: 'kind', required: true, max: 16 })
    if (kindParam !== 'day-pass' && kindParam !== 'transfer') {
      throw new ValidationError('kind must be "day-pass" or "transfer"')
    }
    const isDayPass = kindParam === 'day-pass'

    const slug = str(body.slug, { field: 'slug', required: true, max: 120 })
    const date = isoDate(body.date, 'date')
    if (date < new Date().toISOString().slice(0, 10)) {
      throw new ValidationError('date cannot be in the past')
    }
    const time = str(body.time, { field: 'time', required: true, max: 5 })
    if (!TIME_RE.test(time)) throw new ValidationError('time must be in HH:MM format')

    const adults = intInRange(body.adults, { field: 'adults', min: 1, max: 40, default: 1 })
    const children = intInRange(body.children, { field: 'children', min: 0, max: 40, default: 0 })
    const pickup = str(body.pickup, { field: 'pickup', max: 300 })
    const dropoff = str(body.dropoff, { field: 'dropoff', max: 300 })
    const guestName = str(body.guestName, { field: 'guestName', required: true, min: 1, max: 100 })
    const mail = email(body.email)
    const phoneNum = phone(body.phone)
    const notes = str(body.notes, { field: 'notes', max: 2000 })

    // The item is the price authority. An inactive item, or one without a MAD
    // price, is not sellable online — the page falls back to an enquiry.
    const item = isDayPass
      ? await prisma.dayPass.findUnique({ where: { slug } })
      : await prisma.transfer.findUnique({ where: { slug } })
    if (!item || !item.active) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (item.priceMadCents <= 0) {
      return NextResponse.json(
        { error: 'This service is not available for online payment.', chargeable: false },
        { status: 422 },
      )
    }

    // Dates the admin closed in Blocked Dates — for this item, for its whole
    // type, or for the entire property. Checked before anything is persisted.
    if (await isServiceBlockedOnDate(kindParam, item.id, date)) {
      return NextResponse.json(
        { error: 'This date is not available.', code: 'DATE_BLOCKED' },
        { status: 409 },
      )
    }

    const amountMad =
      isDayPass && 'childPriceMadCents' in item
        ? dayPassAmountMadCents(adults, children, item.priceMadCents, item.childPriceMadCents)
        : transferAmountMadCents(item.priceMadCents)
    if (amountMad <= 0) {
      return NextResponse.json(
        { error: 'This service is not available for online payment.', chargeable: false },
        { status: 422 },
      )
    }
    const amountMadLabel = formatMadLabel(amountMad)

    const booking = await prisma.serviceBooking.create({
      data: {
        kind: isDayPass ? 'DAY_PASS' : 'TRANSFER',
        itemId: item.id,
        itemSlug: item.slug,
        itemName: item.nameEn,
        date,
        time,
        adults,
        children,
        pickup: isDayPass ? '' : pickup,
        dropoff: isDayPass ? '' : dropoff,
        guestName,
        email: mail,
        phone: phoneNum,
        notes,
        total: amountMadLabel,
        status: 'Pending',
      },
    })

    // Short human-readable reference, same shape as a room reservation's.
    const ref = `SA-${booking.id.slice(-6).toUpperCase()}`

    return NextResponse.json({
      id: booking.id,
      ref,
      chargeable: true,
      amountMad,
      amountMadLabel,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
