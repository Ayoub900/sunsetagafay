'use client'

import { useActionState } from 'react'
import { updateCredentials } from './actions'

const inputStyle = {
  width: '100%',
  background: '#1a1712',
  border: '1px solid rgba(200,185,154,0.12)',
  borderRadius: 4,
  padding: '12px 14px',
  color: '#c8b99a',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: 9,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  color: 'rgba(200,185,154,0.55)',
  marginBottom: 8,
}

export function AccountForm({ id, username }: { id: string; username: string }) {
  const [state, action, pending] = useActionState(updateCredentials, null)

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name="id" value={id} />

      <div>
        <label style={labelStyle}>Username</label>
        <input name="username" type="text" required defaultValue={username} autoComplete="username" style={inputStyle} />
      </div>

      <div style={{ borderTop: '1px solid rgba(200,185,154,0.07)', paddingTop: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(200,185,154,0.4)', marginBottom: 16, letterSpacing: '0.1em' }}>
          Change password — leave blank to keep current
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input name="currentPassword" type="password" required autoComplete="current-password" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input name="newPassword" type="password" autoComplete="new-password" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input name="confirm" type="password" autoComplete="new-password" style={inputStyle} />
          </div>
        </div>
      </div>

      {state?.error && (
        <div style={{
          background: 'rgba(200,90,53,0.12)',
          border: '1px solid rgba(200,90,53,0.3)',
          borderRadius: 4,
          padding: '10px 14px',
          color: '#e07050',
          fontSize: 12,
        }}>
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div style={{
          background: 'rgba(100,180,100,0.08)',
          border: '1px solid rgba(100,180,100,0.2)',
          borderRadius: 4,
          padding: '10px 14px',
          color: '#7bc87b',
          fontSize: 12,
        }}>
          Credentials updated.
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
          padding: '12px 22px',
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
