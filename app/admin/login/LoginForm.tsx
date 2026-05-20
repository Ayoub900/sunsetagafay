'use client'

import { useActionState } from 'react'
import { login } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <>
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
    </>
  )
}
