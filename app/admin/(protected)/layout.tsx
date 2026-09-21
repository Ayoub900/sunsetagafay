import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

// `google: notranslate` keeps Chrome from auto-translating the admin. Translate
// swaps React's text nodes for its own <font> wrappers, and the next update
// that removes one (a filter click, a count changing) throws NotFoundError and
// takes down the whole page with "This page couldn't load".
export const metadata = { robots: 'noindex, nofollow', other: { google: 'notranslate' } }

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await getAdminSession()
  if (!authed) redirect('/admin/login')

  return <AdminShell>{children}</AdminShell>
}
