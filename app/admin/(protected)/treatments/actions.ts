'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createTreatment(formData: FormData) {
  await guard()
  await prisma.treatment.create({
    data: {
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      duration: String(formData.get('duration')).trim(),
      price:    String(formData.get('price')).trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/treatments')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/treatments')
}

export async function updateTreatment(id: string, formData: FormData) {
  await guard()
  await prisma.treatment.update({
    where: { id },
    data: {
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      duration: String(formData.get('duration')).trim(),
      price:    String(formData.get('price')).trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/treatments')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/treatments')
}

export async function deleteTreatment(id: string) {
  await guard()
  await prisma.treatment.delete({ where: { id } })
  revalidatePath('/admin/treatments')
  revalidatePath('/[lang]', 'layout')

}
