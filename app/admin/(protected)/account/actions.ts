'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function updateCredentials(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
) {
  await guard()

  const id = formData.get('id') as string
  const username = (formData.get('username') as string)?.trim()
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirm = formData.get('confirm') as string

  if (!username || !currentPassword) return { error: 'All fields are required.' }

  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return { error: 'User not found.' }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return { error: 'Current password is incorrect.' }

  const data: { username: string; passwordHash?: string } = { username }

  if (newPassword) {
    if (newPassword.length < 8) return { error: 'New password must be at least 8 characters.' }
    if (newPassword !== confirm) return { error: 'Passwords do not match.' }
    data.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  try {
    await prisma.adminUser.update({ where: { id }, data })
  } catch {
    return { error: 'Username already taken.' }
  }

  revalidatePath('/admin/account')
  return { ok: true }
}
