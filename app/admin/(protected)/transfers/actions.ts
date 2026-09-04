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

export async function createTransfer(formData: FormData) {
  await guard()
  await prisma.transfer.create({
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      duration: String(formData.get('duration')).trim(),
      price:    String(formData.get('price')).trim(),
      // Authoritative online charge, in MAD minor units (centimes), flat per
      // vehicle. The admin form takes MAD. 0 = not payable online.
      priceMadCents: madCents(formData.get('priceMad')),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/transfers')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/transfers')
}

export async function updateTransfer(id: string, formData: FormData) {
  await guard()
  await prisma.transfer.update({
    where: { id },
    data: {
      slug:     String(formData.get('slug')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      copyEn:   String(formData.get('copyEn')).trim(),
      copyFr:   String(formData.get('copyFr')).trim(),
      duration: String(formData.get('duration')).trim(),
      price:    String(formData.get('price')).trim(),
      priceMadCents: madCents(formData.get('priceMad')),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/transfers')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/transfers')
}

export async function deleteTransfer(id: string) {
  await guard()
  await prisma.transfer.delete({ where: { id } })
  revalidatePath('/admin/transfers')
  revalidatePath('/[lang]', 'layout')

}
