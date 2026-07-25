import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isSuiteBlocked } from '@/lib/db'
import { minCheckInDate } from '@/lib/opening'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'
import {
  email,
  intInRange,
  isoDate,
  phone,
  readJsonBody,
  str,
  ValidationError,
} from '@/lib/validation'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`book:${ip}`, 10, 10 * 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  try {
    const body = await readJsonBody(req)

    const suiteName = str(body.suiteName, { field: 'suiteName', required: true, min: 1, max: 200 })
    const checkIn   = isoDate(body.checkIn,  'checkIn')
    const checkOut  = isoDate(body.checkOut, 'checkOut')
    if (checkIn >= checkOut) throw new ValidationError('checkOut must be after checkIn')

    const earliest = minCheckInDate(new Date().toISOString().slice(0, 10))
    if (checkIn < earliest) throw new ValidationError(`Check-in cannot be before ${earliest}`)

    const nights    = intInRange(body.nights, { field: 'nights', min: 1, max: 365, default: 1 })
    const guests    = intInRange(body.guests, { field: 'guests', min: 1, max: 20,  default: 1 })
    const total     = str(body.total,     { field: 'total',     max: 64 })
    const guestName = str(body.guestName, { field: 'guestName', required: true, min: 1, max: 100 })
    const mail      = email(body.email)
    const phoneNum  = phone(body.phone)
    const country   = str(body.country, { field: 'country', max: 100 })
    const notes     = str(body.notes,   { field: 'notes',   max: 2000 })

    // Reject dates the admin has closed for this suite (or the whole property).
    // The availability step already hides these, but a direct POST must not slip
    // through a closure.
    if (await isSuiteBlocked(suiteName, checkIn, checkOut)) {
      throw new ValidationError('These dates are not available for the selected suite', 409)
    }

    const reservation = await prisma.reservation.create({
      data: {
        guestName,
        suite:    suiteName,
        checkIn,
        checkOut,
        nights,
        guests,
        total,
        status:   'Pending',
        notes:    [
          country ? `Country: ${country}` : '',
          notes,
        ].filter(Boolean).join('\n'),
      },
    })

    // Upsert guest record (match by email)
    const existingGuest = await prisma.guest.findFirst({ where: { email: mail } })
    if (existingGuest) {
      await prisma.guest.update({
        where: { id: existingGuest.id },
        data:  { stays: existingGuest.stays + 1 },
      })
    } else {
      await prisma.guest.create({
        data: {
          name:    guestName,
          email:   mail,
          phone:   phoneNum,
          country,
          stays:   1,
        },
      })
    }

    // Short human-readable reference: last 6 chars of Mongo ObjectId, uppercased
    const ref = `SA-${reservation.id.slice(-6).toUpperCase()}`

    return NextResponse.json({ ref, id: reservation.id })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
