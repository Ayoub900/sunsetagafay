'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, null)

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

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(31,26,20,0.5)',
              marginBottom: 8,
            }}>
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              style={{
                width: '100%',
                background: '#EDE5D0',
                border: '1px solid rgba(31,26,20,0.15)',
                borderRadius: 4,
                padding: '12px 14px',
                color: '#1F1A14',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(31,26,20,0.5)',
              marginBottom: 8,
            }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: '#EDE5D0',
                border: '1px solid rgba(31,26,20,0.15)',
                borderRadius: 4,
                padding: '12px 14px',
                color: '#1F1A14',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {state?.error && (
            <div style={{
              background: 'rgba(200,90,53,0.1)',
              border: '1px solid rgba(200,90,53,0.3)',
              borderRadius: 4,
              padding: '10px 14px',
              color: '#A04A2A',
              fontSize: 12,
              letterSpacing: '0.02em',
            }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              background: '#C85A35',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '13px 24px',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {pending ? 'Signing in…' : 'Enter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/admin/setup" style={{ fontSize: 10, color: 'rgba(31,26,20,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
            First time? Set up admin account →
          </a>
        </div>
      </div>
    </div>
  )
}
