'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { resolveServiceName } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { isServiceType } from '@/lib/services'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Reads and validates the block fields shared by create and update. A stay is
// blocked for every night in [startDate, endDate] inclusive, so a single-day
// closure has startDate === endDate.
//
// The picker submits a single `serviceKey` of the form "type::id":
//   "::"            → entire property
//   "suite::"       → all suites
//   "suite::<id>"   → one specific suite
async function readBlock(formData: FormData) {
  const [serviceType, serviceId = ''] = String(formData.get('serviceKey') ?? '').split('::')
  const startDate = String(formData.get('startDate') ?? '').trim()
  const endDate   = String(formData.get('endDate') ?? '').trim()
  const reason    = String(formData.get('reason') ?? '').trim()

  if (serviceType && !isServiceType(serviceType)) throw new Error('Unknown service type')
  if (!ISO_DATE_RE.test(startDate)) throw new Error('Invalid start date')
  if (!ISO_DATE_RE.test(endDate))   throw new Error('Invalid end date')
  if (endDate < startDate)          throw new Error('End date must be on or after the start date')

  const serviceName = await resolveServiceName(serviceType, serviceId)
  return { serviceType, serviceId, serviceName, startDate, endDate, reason }
}

export async function createBlock(formData: FormData) {
  await guard()
  await prisma.availabilityBlock.create({ data: await readBlock(formData) })
  revalidatePath('/admin/availability')
  redirect('/admin/availability')
}

export async function updateBlock(id: string, formData: FormData) {
  await guard()
  await prisma.availabilityBlock.update({ where: { id }, data: await readBlock(formData) })
  revalidatePath('/admin/availability')
  redirect('/admin/availability')
}

export async function deleteBlock(id: string) {
  await guard()
  await prisma.availabilityBlock.delete({ where: { id } })
  revalidatePath('/admin/availability')
}
