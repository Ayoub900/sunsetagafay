import { PAY_META, type PayState, type PayTone } from '@/lib/payments/view'
import { T } from './tokens'

// Shared so every screen colours "paid" and "not paid" identically — the whole
// point is that staff learn one signal. The badge is the only place payment
// state introduces colour: rows, tiles and cards stay on the neutral palette so
// a long list reads as one calm table rather than a wall of stripes.
// Pure presentation, no server-only imports, so client components may use it.

export const payToneColors: Record<PayTone, { bg: string; fg: string; dot: string }> = {
  paid:   { bg: '#E7F2EA', fg: '#1F6B3B', dot: '#2E8B57' },
  warn:   { bg: '#FDF3E2', fg: '#8A5A12', dot: '#C68B1E' },
  unpaid: { bg: '#FBE4E1', fg: '#9A2E1E', dot: '#C2442E' },
  alert:  { bg: '#FBE8E4', fg: '#9A3412', dot: '#B3441A' },
  info:   { bg: '#EAEAF6', fg: '#3B3B8A', dot: '#5A5AB0' },
  muted:  { bg: 'rgba(31,26,20,0.06)', fg: T.ink3, dot: T.ink3 },
}

export function PayBadge({ state, big = false }: { state: PayState; big?: boolean }) {
  const meta = PAY_META[state]
  const c = payToneColors[meta.tone]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: big ? '5px 12px' : '4px 10px',
      background: c.bg, color: c.fg, borderRadius: 999,
      fontFamily: 'var(--sans, system-ui)', fontSize: big ? 13 : 12.5, fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.01em',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: c.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  )
}
