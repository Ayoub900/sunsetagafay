import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'
import { email, phone, readJsonBody, str, ValidationError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`contact:${ip}`, 5, 10 * 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  try {
    const body = await readJsonBody(req)

    const name     = str(body.name,     { field: 'name',     required: true, min: 1, max: 100 })
    const mail     = email(body.email)
    const phoneNum = phone(body.phone)
    const subject  = str(body.subject,  { field: 'subject',  max: 200 })
    const message  = str(body.message,  { field: 'message',  required: true, min: 1, max: 5000 })
    const checkin  = str(body.checkin,  { field: 'checkin',  max: 32 })
    const checkout = str(body.checkout, { field: 'checkout', max: 32 })
    const guests   = str(body.guests,   { field: 'guests',   max: 32 })

    await prisma.contactMessage.create({
      data: {
        name,
        email:    mail,
        phone:    phoneNum,
        subject,
        message,
        checkin,
        checkout,
        guests,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
