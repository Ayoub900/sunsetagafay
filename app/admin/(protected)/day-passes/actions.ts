'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

/** MAD entered in the admin form -> integer centimes, never negative. */
function madCents(v: FormDataEntryValue | null): number {
  return Math.max(0, Math.round((Number(v) || 0) * 100))
}

export async function createDayPass(formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.dayPass.create({
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn') ?? '').trim(),
      ledeFr:   String(formData.get('ledeFr') ?? '').trim(),
      copyEn:   String(formData.get('copyEn') ?? '').trim(),
      copyFr:   String(formData.get('copyFr') ?? '').trim(),
      hours:    String(formData.get('hours') ?? '').trim(),
      price:    String(formData.get('price') ?? '').trim(),
      currency: String(formData.get('currency') ?? '€').trim() || '€',
      // Authoritative online charge, in MAD minor units (centimes). The admin
      // form takes MAD; we store centimes. 0 = not payable online.
      priceMadCents:      madCents(formData.get('priceMad')),
      childPriceMadCents: madCents(formData.get('childPriceMad')),
      heroImageUrl,
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/day-passes')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/day-passes')
}

export async function updateDayPass(id: string, formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.dayPass.update({
    where: { id },
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn') ?? '').trim(),
      ledeFr:   String(formData.get('ledeFr') ?? '').trim(),
      copyEn:   String(formData.get('copyEn') ?? '').trim(),
      copyFr:   String(formData.get('copyFr') ?? '').trim(),
      hours:    String(formData.get('hours') ?? '').trim(),
      price:    String(formData.get('price') ?? '').trim(),
      currency: String(formData.get('currency') ?? '€').trim() || '€',
      priceMadCents:      madCents(formData.get('priceMad')),
      childPriceMadCents: madCents(formData.get('childPriceMad')),
      heroImageUrl,
      imageUrl,
      images,
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/day-passes')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/day-passes')
}

export async function deleteDayPass(id: string) {
  await guard()
  await prisma.dayPass.delete({ where: { id } })
  revalidatePath('/admin/day-passes')
  revalidatePath('/[lang]', 'layout')
}
