import type { CSSProperties } from 'react'

// ── SunburstMark ──────────────────────────────────────────────
interface SunburstMarkProps {
  size?: number
  rays?: number
  stroke?: number
  color?: string
  style?: CSSProperties
}

export function SunburstMark({ size = 28, rays = 16, stroke = 1, color = 'currentColor', style }: SunburstMarkProps) {
  const r1 = size * 0.18
  const r2 = size * 0.46
  const c  = size / 2
  const lines: React.ReactNode[] = []
  for (let i = 0; i < rays; i++) {
    const a  = (i / rays) * Math.PI * 2 - Math.PI / 2
    const x1 = c + Math.cos(a) * r1
    const y1 = c + Math.sin(a) * r1
    const x2 = c + Math.cos(a) * r2
    const y2 = c + Math.sin(a) * r2
    lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)
  }
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={style}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      aria-hidden="true"
    >
      <circle cx={c} cy={c} r={size * 0.085} />
      {lines}
    </svg>
  )
}

// ── GrainOverlay ──────────────────────────────────────────────
interface GrainOverlayProps {
  opacity?: number
  blend?: string
  style?: CSSProperties
}

export function GrainOverlay({ opacity = 0.5, blend = 'overlay', style }: GrainOverlayProps) {
  return (
    <div
      className="grain"
      style={{ opacity, mixBlendMode: blend as CSSProperties['mixBlendMode'], ...style }}
      aria-hidden="true"
    />
  )
}

// ── AnimatedHeadline ──────────────────────────────────────────
interface AnimatedHeadlineProps {
  text: string
  scriptWord?: string
  delay?: number
  step?: number
  className?: string
  style?: CSSProperties
  as?: keyof React.JSX.IntrinsicElements
}

export function AnimatedHeadline({
  text, scriptWord,
  delay = 200, step = 90,
  className = '', style,
  as: Tag = 'h1',
}: AnimatedHeadlineProps) {
  const words = text.split(/(\s+)/)
  let i = 0
  return (
    <Tag className={`headline ${className}`} style={style}>
      {words.map((w, k) => {
        if (/^\s+$/.test(w)) return <span key={k}>{w}</span>
        const isScript = scriptWord && w.replace(/[^\p{L}']/gu, '') === scriptWord
        const d = delay + step * i++
        return (
          <span
            key={k}
            className="reveal-word"
            style={{
              animationDelay: `${d}ms`,
              fontFamily:    isScript ? 'var(--script)' : undefined,
              fontStyle:     isScript ? 'italic'         : undefined,
              fontWeight:    isScript ? 400               : undefined,
              fontSize:      isScript ? '1.45em'          : undefined,
              lineHeight:    isScript ? 0.6               : undefined,
              letterSpacing: isScript ? '-0.01em'         : undefined,
              color:         isScript ? 'var(--brass)'    : undefined,
              padding:       isScript ? '0 0.05em'        : undefined,
              display:       'inline-block',
            }}
          >
            {w}
          </span>
        )
      })}
    </Tag>
  )
}

// ── Photo ─────────────────────────────────────────────────────
type PhotoKind = 'sunset' | 'palms' | 'pool' | 'courtyard' | 'aperitif'

interface PhotoProps {
  kind?: PhotoKind
  src?: string
  style?: CSSProperties
  children?: React.ReactNode
  grain?: boolean
  halation?: boolean
  className?: string
  alt?: string
  priority?: boolean
}

export function Photo({ kind = 'sunset', src, style, children, grain = true, halation = true, className = '', alt, priority = false }: PhotoProps) {
  return (
    <div
      className={`photo photo-${kind} ${className}`}
      style={style}
      role={src ? undefined : (alt ? 'img' : undefined)}
      aria-label={src ? undefined : alt}
    >
      {src && (
        <img
          src={src}
          alt={alt ?? ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      )}
      {halation && <div className="halation" aria-hidden="true" style={{ zIndex: 2 }} />}
      {grain    && <GrainOverlay opacity={0.35} blend="overlay" style={{ zIndex: 3 }} />}
      {children}
    </div>
  )
}

// ── EstStamp ──────────────────────────────────────────────────
interface EstStampProps { year?: string; style?: CSSProperties }
export function EstStamp({ year = 'MMXXV', style }: EstStampProps) {
  return (
    <div className="est-stamp" style={style}>
      <span className="est-rule" />
      <span>EST&nbsp;·&nbsp;2025</span>
      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', letterSpacing: '0.18em', opacity: 0.75 }}>{year}</span>
    </div>
  )
}

// ── SectionHead ───────────────────────────────────────────────
interface SectionHeadProps {
  index?: string
  eyebrow: string
  title: string
  lede?: string
  tone?: 'ink' | 'cream'
  as?: 'h2' | 'h1'
}

export function SectionHead({ index, eyebrow, title, lede, tone = 'ink', as: Tag = 'h2' }: SectionHeadProps) {
  const accent = tone === 'cream' ? 'var(--rose)'   : 'var(--sienna)'
  return (
    <div className={`section-head${tone === 'cream' ? ' cream' : ''}`}>
      <div className="eyebrow no-lead" style={{ color: accent }}>{eyebrow}</div>
      <Tag className="section-head-title">{title}</Tag>
      <div className="section-head-meta">
        {index && <span className="section-head-index">{index}</span>}
        {lede  && <p className="section-head-lede">{lede}</p>}
      </div>
    </div>
  )
}
