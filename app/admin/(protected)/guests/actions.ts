'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createGuest(formData: FormData) {
  await guard()
  await prisma.guest.create({
    data: {
      name:    String(formData.get('name')).trim(),
      email:   String(formData.get('email') ?? '').trim(),
      phone:   String(formData.get('phone') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      stays:   Number(formData.get('stays')) || 0,
      vip:     formData.get('vip') === 'on',
      notes:   String(formData.get('notes') ?? '').trim(),
    },
  })
  revalidatePath('/admin/guests')
  redirect('/admin/guests')
}

export async function updateGuest(id: string, formData: FormData) {
  await guard()
  await prisma.guest.update({
    where: { id },
    data: {
      name:    String(formData.get('name')).trim(),
      email:   String(formData.get('email') ?? '').trim(),
      phone:   String(formData.get('phone') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      stays:   Number(formData.get('stays')) || 0,
      vip:     formData.get('vip') === 'on',
      notes:   String(formData.get('notes') ?? '').trim(),
    },
  })
  revalidatePath('/admin/guests')
  redirect('/admin/guests')
}

export async function deleteGuest(id: string) {
  await guard()
  await prisma.guest.delete({ where: { id } })
  revalidatePath('/admin/guests')
}
