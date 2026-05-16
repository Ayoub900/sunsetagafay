import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { suiteName, checkIn, checkOut, nights, guests, total, guestName, email, phone, country, notes } = body

    if (!suiteName || !checkIn || !checkOut || !guestName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const reservation = await prisma.reservation.create({
      data: {
        guestName: String(guestName).trim(),
        suite:     String(suiteName).trim(),
        checkIn:   String(checkIn).trim(),
        checkOut:  String(checkOut).trim(),
        nights:    Number(nights) || 1,
        guests:    Number(guests) || 1,
        total:     String(total ?? '').trim(),
        status:    'Pending',
        notes:     [
          country ? `Country: ${country}` : '',
          notes ? notes : '',
        ].filter(Boolean).join('\n'),
      },
    })

    // Upsert guest record (match by email)
    const existingGuest = await prisma.guest.findFirst({ where: { email: String(email).toLowerCase().trim() } })
    if (existingGuest) {
      await prisma.guest.update({
        where: { id: existingGuest.id },
        data: { stays: existingGuest.stays + 1 },
      })
    } else {
      await prisma.guest.create({
        data: {
          name:    String(guestName).trim(),
          email:   String(email).toLowerCase().trim(),
          phone:   String(phone ?? '').trim(),
          country: String(country ?? '').trim(),
          stays:   1,
        },
      })
    }

    // Short human-readable reference: last 6 chars of Mongo ObjectId, uppercased
    const ref = `SA-${reservation.id.slice(-6).toUpperCase()}`

    return NextResponse.json({ ref, id: reservation.id })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
