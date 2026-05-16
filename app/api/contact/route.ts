import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, phone, subject, message, checkin, checkout, guests } = body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required' }, { status: 422 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }

  await prisma.contactMessage.create({
    data: {
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      phone:    (phone ?? '').trim(),
      subject:  (subject ?? '').trim(),
      message:  message.trim(),
      checkin:  (checkin ?? '').trim(),
      checkout: (checkout ?? '').trim(),
      guests:   (guests ?? '').trim(),
    },
  })

  return NextResponse.json({ ok: true })
}
