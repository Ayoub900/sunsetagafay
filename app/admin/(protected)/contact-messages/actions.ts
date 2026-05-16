'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function markRead(id: string, read: boolean) {
  await guard()
  await prisma.contactMessage.update({ where: { id }, data: { read } })
  revalidatePath('/admin/contact-messages')
}

export async function deleteMessage(id: string) {
  await guard()
  await prisma.contactMessage.delete({ where: { id } })
  revalidatePath('/admin/contact-messages')
}
