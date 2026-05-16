'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setAdminSession, clearAdminSession } from '@/lib/auth'

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) return { error: 'Username and password are required.' }

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user) return { error: 'Invalid credentials.' }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return { error: 'Invalid credentials.' }

  await setAdminSession()
  redirect('/admin/dashboard')
}

export async function logout() {
  await clearAdminSession()
  redirect('/admin/login')
}
