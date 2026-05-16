import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'sa_admin'

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!token || !process.env.ADMIN_TOKEN) return false
  return token === process.env.ADMIN_TOKEN
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_COOKIE, process.env.ADMIN_TOKEN!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}
