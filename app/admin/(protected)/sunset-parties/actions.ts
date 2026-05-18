'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createParty(formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  await prisma.sunsetParty.create({
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      capacity: String(formData.get('capacity')).trim(),
      season:   String(formData.get('season')).trim(),
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/sunset-parties')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/sunset-parties')
}

export async function updateParty(id: string, formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  await prisma.sunsetParty.update({
    where: { id },
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      capacity: String(formData.get('capacity')).trim(),
      season:   String(formData.get('season')).trim(),
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/sunset-parties')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/sunset-parties')
}

export async function deleteParty(id: string) {
  await guard()
  await prisma.sunsetParty.delete({ where: { id } })
  revalidatePath('/admin/sunset-parties')
  revalidatePath('/[lang]', 'layout')
}

export async function togglePartiesEnabled(formData: FormData) {
  await guard()
  const enabled = formData.get('enabled') === '1'
  await prisma.siteSettings.upsert({
    where:  { key: 'default' },
    update: { partiesEnabled: enabled },
    create: { key: 'default', partiesEnabled: enabled },
  })
  revalidatePath('/admin/sunset-parties')
  revalidatePath('/[lang]', 'layout')
  revalidatePath('/sitemap.xml')
}
