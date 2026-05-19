'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setAdminSession, clearAdminSession } from '@/lib/auth'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { str, ValidationError } from '@/lib/validation'

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const h  = await headers()
  const ip = getClientIp(h)
  const rl = rateLimit(`login:${ip}`, 5, 15 * 60_000)
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} min.` }
  }

  let username: string
  let password: string
  try {
    username = str(formData.get('username'), { field: 'username', required: true, min: 1, max: 100 })
    password = str(formData.get('password'), { field: 'password', required: true, min: 1, max: 200 })
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'Invalid input.' }
  }

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
