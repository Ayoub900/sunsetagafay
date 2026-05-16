'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createRestaurant(formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  await prisma.restaurant.create({
    data: {
      slug:     String(formData.get('slug')).trim(),
      plate:    String(formData.get('plate')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      hours:    String(formData.get('hours')).trim(),
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/restaurants')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/restaurants')
}

export async function updateRestaurant(id: string, formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  await prisma.restaurant.update({
    where: { id },
    data: {
      slug:     String(formData.get('slug')).trim(),
      plate:    String(formData.get('plate')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      hours:    String(formData.get('hours')).trim(),
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/restaurants')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/restaurants')
}

export async function deleteRestaurant(id: string) {
  await guard()
  await prisma.restaurant.delete({ where: { id } })
  revalidatePath('/admin/restaurants')
  revalidatePath('/[lang]', 'layout')
}
