import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SetupForm } from './SetupForm'

export default async function SetupPage() {
  const existing = await prisma.adminUser.count()
  if (existing > 0) redirect('/admin/login')

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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div translate="no" className="notranslate" style={{ color: '#1F1A14', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Sunset Agafay
          </div>
          <div style={{ color: 'rgba(31,26,20,0.4)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 4 }}>
            First-time Setup
          </div>
        </div>
        <SetupForm />
      </div>
    </div>
  )
}
