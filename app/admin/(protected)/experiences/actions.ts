'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createExperience(formData: FormData) {
  await guard()
  await prisma.experience.create({
    data: {
      n:        String(formData.get('n')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      when:     String(formData.get('when')).trim(),
      who:      String(formData.get('who')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/experiences')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/experiences')
}

export async function updateExperience(id: string, formData: FormData) {
  await guard()
  await prisma.experience.update({
    where: { id },
    data: {
      n:        String(formData.get('n')).trim(),
      nameEn:   String(formData.get('nameEn')).trim(),
      nameFr:   String(formData.get('nameFr')).trim(),
      when:     String(formData.get('when')).trim(),
      who:      String(formData.get('who')).trim(),
      ledeEn:   String(formData.get('ledeEn')).trim(),
      ledeFr:   String(formData.get('ledeFr')).trim(),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
      active:   formData.get('active') === 'on',
      order:    Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/experiences')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/experiences')
}

export async function deleteExperience(id: string) {
  await guard()
  await prisma.experience.delete({ where: { id } })
  revalidatePath('/admin/experiences')
  revalidatePath('/[lang]', 'layout')
}
