import { T } from './tokens'
import { Icon, IconName } from './icons'

interface StatCardProps {
  icon: IconName
  label: string
  value: string | number
  delta?: string
  deltaTone?: 'ok' | 'bad' | 'brass' | 'flat'
  foot?: string
}

export function StatCard({ icon, label, value, delta, deltaTone = 'ok', foot }: StatCardProps) {
  const tones = {
    ok:    { fg: T.ok,    sign: '↑' },
    bad:   { fg: T.sienna, sign: '↓' },
    brass: { fg: T.brass, sign: '↑' },
    flat:  { fg: T.ink3,  sign: '·' },
  }
  const tone = tones[deltaTone]

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.line}`,
      borderRadius: T.radius,
      boxShadow: T.shadow,
      padding: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: T.radiusSm,
          background: T.surfaceAlt, color: T.sienna,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} />
        </div>
        {delta && (
          <span style={{
            fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600,
            color: tone.fg,
          }}>{tone.sign} {delta}</span>
        )}
      </div>
      <div style={{
        marginTop: 18, fontFamily: 'var(--sans, system-ui)', fontSize: 13,
        color: T.ink3, fontWeight: 500,
      }}>{label}</div>
      <div style={{
        marginTop: 4,
        fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 400,
        fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.018em',
        color: T.ink,
      }}>{value}</div>
      {foot && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: `1px solid ${T.line}`,
          fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3,
          lineHeight: 1.55,
        }}>{foot}</div>
      )}
    </div>
  )
}
