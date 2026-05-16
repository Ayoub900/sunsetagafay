import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = { robots: 'noindex, nofollow' }

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await getAdminSession()
  if (!authed) redirect('/admin/login')

  return <AdminShell>{children}</AdminShell>
}
