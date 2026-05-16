import { T } from './tokens'
import { Icon, IconName } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, { bg: string; fg: string; bd: string }> = {
  primary:   { bg: T.sienna,       fg: '#FFF8EE', bd: T.sienna },
  secondary: { bg: T.surface,      fg: T.ink,     bd: T.line2 },
  ghost:     { bg: 'transparent',  fg: T.ink,     bd: 'transparent' },
  danger:    { bg: 'transparent',  fg: T.sienna,  bd: 'rgba(160,74,42,0.36)' },
}

const sizes: Record<Size, { pad: string; fs: number; h: number; gap: number }> = {
  sm: { pad: '6px 10px',  fs: 12.5, h: 30, gap: 6 },
  md: { pad: '9px 14px',  fs: 13.5, h: 36, gap: 8 },
  lg: { pad: '11px 18px', fs: 14,   h: 42, gap: 10 },
}

interface AdminBtnProps {
  variant?: Variant
  size?: Size
  icon?: IconName
  children?: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
  href?: string
  disabled?: boolean
}

export function AdminBtn({ variant = 'ghost', size = 'md', icon, children, onClick, type = 'button', style, disabled }: AdminBtnProps) {
  const v = variants[variant]
  const s = sizes[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: s.gap,
        padding: s.pad,
        height: s.h,
        background: v.bg, color: v.fg,
        border: `1px solid ${v.bd}`,
        borderRadius: T.radiusSm,
        fontFamily: 'var(--sans, system-ui)', fontSize: s.fs, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        textDecoration: 'none',
        transition: 'background 180ms, opacity 180ms',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}
