'use client'

import { useState, useTransition } from 'react'
import { seedDatabase } from './actions'
import { T } from '@/components/admin/tokens'

export function SeedButton({ label = 'Seed database' }: { label?: string }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; seeded?: Record<string, number>; error?: string } | null>(null)

  function handleSeed() {
    startTransition(async () => {
      const res = await seedDatabase()
      setResult(res)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <button
        onClick={handleSeed}
        disabled={pending}
        style={{
          padding: '9px 18px',
          background: pending ? 'rgba(160,74,42,0.5)' : T.sienna,
          color: '#FFF8EE', border: 'none',
          borderRadius: T.radiusSm,
          fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500,
          cursor: pending ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {pending ? 'Seeding…' : label}
      </button>

      {result && (
        <div style={{
          fontFamily: 'var(--sans, system-ui)', fontSize: 13, lineHeight: 1.6,
          padding: '12px 16px', borderRadius: T.radiusSm,
          background: result.ok ? T.okSoft : T.siennaSoft,
          border: `1px solid ${result.ok ? 'rgba(94,140,87,0.25)' : 'rgba(160,74,42,0.25)'}`,
          color: result.ok ? '#3F6238' : T.sienna,
          minWidth: 200,
        }}>
          {result.ok ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Reseed complete</div>
              {result.seeded && Object.entries(result.seeded).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ textTransform: 'capitalize', color: T.ink2 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>+{v}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Seed failed</div>
              <div style={{ fontSize: 12, color: T.ink3, wordBreak: 'break-all' }}>{result.error}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
