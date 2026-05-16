import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { AccountForm } from './AccountForm'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { T } from '@/components/admin/tokens'

export default async function AccountPage() {
  const authed = await getAdminSession()
  if (!authed) redirect('/admin/login')

  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } })
  const user = users[0]
  if (!user) redirect('/admin/setup')

  return (
    <>
      <AdminTopbar crumbs={['Operations', 'Account']} />
      <PageHead title="Account" lede="Manage your admin credentials." />
      <div style={{ padding: '8px 32px 48px', maxWidth: 520 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
          <AccountForm id={user.id} username={user.username} />
        </div>
      </div>
    </>
  )
}
