'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createEvent(formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.event.create({
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn') ?? '').trim(),
      ledeFr:   String(formData.get('ledeFr') ?? '').trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      capacity: String(formData.get('capacity')).trim(),
      venueEn:  String(formData.get('venueEn') ?? '').trim(),
      venueFr:  String(formData.get('venueFr') ?? '').trim(),
      heroImageUrl,
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/events')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/events')
}

export async function updateEvent(id: string, formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.event.update({
    where: { id },
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn') ?? '').trim(),
      ledeFr:   String(formData.get('ledeFr') ?? '').trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      capacity: String(formData.get('capacity')).trim(),
      venueEn:  String(formData.get('venueEn') ?? '').trim(),
      venueFr:  String(formData.get('venueFr') ?? '').trim(),
      heroImageUrl,
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/events')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/events')
}

export async function deleteEvent(id: string) {
  await guard()
  await prisma.event.delete({ where: { id } })
  revalidatePath('/admin/events')
  revalidatePath('/[lang]', 'layout')
}
