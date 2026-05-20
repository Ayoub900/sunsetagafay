import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSuites } from '@/lib/db'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'
import { isoDate, readJsonBody, ValidationError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`avail:${ip}`, 30, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  try {
    const body     = await readJsonBody(req)
    const checkIn  = isoDate(body.checkIn,  'checkIn')
    const checkOut = isoDate(body.checkOut, 'checkOut')

    if (checkIn >= checkOut) throw new ValidationError('checkOut must be after checkIn')

    const today = new Date().toISOString().slice(0, 10)
    if (checkIn < today) throw new ValidationError('Check-in cannot be in the past')

    const suites = await getAvailableSuites(checkIn, checkOut)

    const nights = Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    )

    const result = suites.map(s => {
      const rateNum = parseFloat(s.rate.replace(/[^0-9.]/g, '')) || 0
      return {
        id:        s.id,
        slug:      s.slug,
        nameEn:    s.nameEn,
        nameFr:    s.nameFr,
        briefEn:   s.briefEn,
        briefFr:   s.briefFr,
        area:      s.area,
        view:      s.view,
        rate:      s.rate,
        rateNum,
        total:     rateNum ? `${s.rate.replace(/[\d.,]+/, (n) => String(Math.round(parseFloat(n.replace(/,/g, '')) * nights)))}` : '',
        imageKind: s.imageKind,
      }
    })

    return NextResponse.json({ suites: result, nights })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
