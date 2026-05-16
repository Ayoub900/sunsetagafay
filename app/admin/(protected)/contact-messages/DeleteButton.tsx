'use client'

import { T } from '@/components/admin/tokens'

export function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={e => { if (!confirm('Delete this inquiry?')) e.preventDefault() }}
      style={{
        padding: '7px 12px',
        background: 'transparent', color: T.sienna,
        border: `1px solid rgba(160,74,42,0.3)`,
        borderRadius: T.radiusSm,
        fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      Delete
    </button>
  )
}
