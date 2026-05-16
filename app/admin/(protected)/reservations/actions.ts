'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createReservation(formData: FormData) {
  await guard()
  await prisma.reservation.create({
    data: {
      guestName: String(formData.get('guestName')).trim(),
      suite:     String(formData.get('suite')).trim(),
      checkIn:   String(formData.get('checkIn')).trim(),
      checkOut:  String(formData.get('checkOut')).trim(),
      nights:    Number(formData.get('nights')) || 1,
      guests:    Number(formData.get('guests')) || 1,
      total:     String(formData.get('total') ?? '').trim(),
      status:    String(formData.get('status') ?? 'Pending').trim(),
      notes:     String(formData.get('notes') ?? '').trim(),
    },
  })
  revalidatePath('/admin/reservations')
  redirect('/admin/reservations')
}

export async function updateReservation(id: string, formData: FormData) {
  await guard()
  await prisma.reservation.update({
    where: { id },
    data: {
      guestName: String(formData.get('guestName')).trim(),
      suite:     String(formData.get('suite')).trim(),
      checkIn:   String(formData.get('checkIn')).trim(),
      checkOut:  String(formData.get('checkOut')).trim(),
      nights:    Number(formData.get('nights')) || 1,
      guests:    Number(formData.get('guests')) || 1,
      total:     String(formData.get('total') ?? '').trim(),
      status:    String(formData.get('status') ?? 'Pending').trim(),
      notes:     String(formData.get('notes') ?? '').trim(),
    },
  })
  revalidatePath('/admin/reservations')
  redirect('/admin/reservations')
}

export async function deleteReservation(id: string) {
  await guard()
  await prisma.reservation.delete({ where: { id } })
  revalidatePath('/admin/reservations')
}
