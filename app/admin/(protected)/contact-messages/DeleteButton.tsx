'use client'

import { T } from '@/components/admin/tokens'

export function DeleteButton() {
  return (
    <button
      type="submit"
      className="inq-btn"
      onClick={e => { if (!confirm('Delete this inquiry?')) e.preventDefault() }}
      style={{
        background: 'transparent', color: T.sienna,
        border: `1px solid rgba(160,74,42,0.3)`,
      }}
    >
      Delete
    </button>
  )
}
