'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setAdminSession } from '@/lib/auth'

export async function setupAdmin(_prev: { error?: string } | null, formData: FormData) {
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string

  if (!username || !password || !confirm) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const existing = await prisma.adminUser.count()
  if (existing > 0) return { error: 'An admin account already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    await prisma.adminUser.create({ data: { username, passwordHash } })
  } catch {
    return { error: 'Username already taken.' }
  }

  await setAdminSession()
  redirect('/admin/dashboard')
}
