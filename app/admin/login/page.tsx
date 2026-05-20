import { redirect, notFound } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoginForm } from './LoginForm'

export const metadata = { robots: 'noindex, nofollow' }

export default async function AdminLoginPage() {
  const authed = await getAdminSession()
  if (authed) {
    const hasAdmin = await prisma.adminUser.count()
    if (hasAdmin > 0) redirect('/admin/dashboard')
    notFound()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F1E4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--sans, system-ui)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(200,90,53,0.5)',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              {Array.from({ length: 16 }, (_, i) => {
                const angle = (i * 360) / 16
                const rad = (angle * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={20 + 8 * Math.cos(rad)}
                    y1={20 + 8 * Math.sin(rad)}
                    x2={20 + 18 * Math.cos(rad)}
                    y2={20 + 18 * Math.sin(rad)}
                    stroke="#C85A35"
                    strokeWidth={i % 2 === 0 ? 1.5 : 0.75}
                  />
                )
              })}
            </svg>
          </div>
          <div style={{ color: '#1F1A14', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Sunset Agafay
          </div>
          <div style={{ color: 'rgba(31,26,20,0.4)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 4 }}>
            Admin Access
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
