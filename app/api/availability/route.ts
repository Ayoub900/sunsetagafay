import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSuites } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { checkIn, checkOut } = await req.json()

    if (!checkIn || !checkOut || checkIn >= checkOut) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    if (checkIn < today) {
      return NextResponse.json({ error: 'Check-in cannot be in the past' }, { status: 400 })
    }

    const suites = await getAvailableSuites(checkIn, checkOut)

    const nights = Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    )

    const result = suites.map(s => {
      const rateNum = parseFloat(s.rate.replace(/[^0-9.]/g, '')) || 0
      return {
        id:        s.id,
        slug:      s.slug,
        plate:     s.plate,
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
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
