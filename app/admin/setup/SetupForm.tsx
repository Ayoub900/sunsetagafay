'use client'

import { useActionState } from 'react'
import { setupAdmin } from './actions'

const inputStyle = {
  width: '100%',
  background: '#EDE5D0',
  border: '1px solid rgba(31,26,20,0.15)',
  borderRadius: 4,
  padding: '12px 14px',
  color: '#1F1A14',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: 9,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  color: 'rgba(31,26,20,0.5)',
  marginBottom: 8,
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAdmin, null)

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Username</label>
        <input name="username" type="text" required autoComplete="username" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input name="password" type="password" required autoComplete="new-password" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Confirm Password</label>
        <input name="confirm" type="password" required autoComplete="new-password" style={inputStyle} />
      </div>

      {state?.error && (
        <div style={{
          background: 'rgba(200,90,53,0.12)',
          border: '1px solid rgba(200,90,53,0.3)',
          borderRadius: 4,
          padding: '10px 14px',
          color: '#A04A2A',
          fontSize: 12,
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
        {pending ? 'Creating…' : 'Create Admin Account'}
      </button>
    </form>
  )
}
