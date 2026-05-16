import { T } from './tokens'

type PillTone = 'ink' | 'sienna' | 'brass' | 'rose' | 'ok' | 'soft'

const toneMap: Record<PillTone, { bg: string; fg: string; dot: string }> = {
  ink:    { bg: 'rgba(31,26,20,0.06)', fg: T.ink,    dot: T.ink },
  sienna: { bg: T.siennaSoft,          fg: T.sienna, dot: T.sienna },
  brass:  { bg: T.brassSoft,           fg: '#7C5D27', dot: T.brass },
  rose:   { bg: T.roseSoft,            fg: '#8A4730', dot: '#C28162' },
  ok:     { bg: T.okSoft,              fg: '#3F6238', dot: T.ok },
  soft:   { bg: 'rgba(31,26,20,0.04)', fg: T.ink3,   dot: T.ink3 },
}

export function Pill({ tone = 'ink', dot = true, children }: { tone?: PillTone; dot?: boolean; children: React.ReactNode }) {
  const p = toneMap[tone]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px',
      background: p.bg, color: p.fg,
      borderRadius: 999,
      fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 500,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: p.dot, flexShrink: 0 }} />}
      {children}
    </span>
  )
}

export function StatusPill({ v }: { v: string }) {
  const toneFor: Record<string, PillTone> = {
    Confirmed: 'brass', Pending: 'soft', 'In-house': 'ok', Departing: 'rose',
    Active: 'ok', Draft: 'soft', Inactive: 'soft', Hidden: 'soft',
    Maintenance: 'sienna', VIP: 'brass',
  }
  return <Pill tone={toneFor[v] ?? 'ink'}>{v}</Pill>
}
