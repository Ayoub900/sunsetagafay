'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function createSuite(formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.suite.create({
    data: {
      slug:      String(formData.get('slug')).trim(),
      nameEn:    String(formData.get('nameEn')).trim(),
      nameFr:    String(formData.get('nameFr')).trim(),
      briefEn:          String(formData.get('briefEn')).trim(),
      briefFr:          String(formData.get('briefFr')).trim(),
      descriptionEn:    String(formData.get('descriptionEn')).trim(),
      descriptionFr:    String(formData.get('descriptionFr')).trim(),
      area:      String(formData.get('area')).trim(),
      view:      String(formData.get('view')).trim(),
      rate:      String(formData.get('rate')).trim(),
      // Authoritative online charge, in MAD minor units (centimes). The admin
      // form takes MAD; we store centimes. 0 = not payable online.
      rateMadCents: Math.max(0, Math.round((Number(formData.get('rateMad')) || 0) * 100)),
      imageKind: String(formData.get('imageKind')).trim() || 'sunset',
      heroImageUrl,
      imageUrl,
      images,
      active:    formData.get('active') === 'on',
      order:     Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/suites')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/suites')
}

export async function updateSuite(id: string, formData: FormData) {
  await guard()
  const images = formData.getAll('images').map(String).filter(Boolean)
  const imageUrl = images[0] ?? String(formData.get('imageUrl') ?? '').trim()
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  await prisma.suite.update({
    where: { id },
    data: {
      slug:      String(formData.get('slug')).trim(),
      nameEn:    String(formData.get('nameEn')).trim(),
      nameFr:    String(formData.get('nameFr')).trim(),
      briefEn:          String(formData.get('briefEn')).trim(),
      briefFr:          String(formData.get('briefFr')).trim(),
      descriptionEn:    String(formData.get('descriptionEn')).trim(),
      descriptionFr:    String(formData.get('descriptionFr')).trim(),
      area:      String(formData.get('area')).trim(),
      view:      String(formData.get('view')).trim(),
      rate:      String(formData.get('rate')).trim(),
      // Authoritative online charge, in MAD minor units (centimes). The admin
      // form takes MAD; we store centimes. 0 = not payable online.
      rateMadCents: Math.max(0, Math.round((Number(formData.get('rateMad')) || 0) * 100)),
      imageKind: String(formData.get('imageKind')).trim() || 'sunset',
      heroImageUrl,
      imageUrl,
      images,
      active:    formData.get('active') === 'on',
      order:     Number(formData.get('order')) || 0,
    },
  })
  revalidatePath('/admin/suites')
  revalidatePath('/[lang]', 'layout')
  redirect('/admin/suites')
}

export async function deleteSuite(id: string) {
  await guard()
  await prisma.suite.delete({ where: { id } })
  revalidatePath('/admin/suites')
  revalidatePath('/[lang]', 'layout')
}
