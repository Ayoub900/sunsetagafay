import { CONTACT_PHONE, CONTACT_EMAIL, PRESS_EMAIL } from '@/lib/contact'

interface PracticalDict {
  locale_label: string; locale_h: string; locale_lines: string[]
  coords_label: string; coords_h: string; coords_lines: string[]
  hours_label: string; hours_h: string; hours_lines: string[]
  contact_label: string; contact_h: string; contact_lines: string[]
}

export function Practical({ dict }: { dict: PracticalDict }) {
  const contactExtras = dict.contact_lines.filter(Boolean)
  const contactLines = [
    CONTACT_EMAIL,
    ...contactExtras,
    PRESS_EMAIL && `Press · ${PRESS_EMAIL}`,
  ].filter((l): l is string => Boolean(l))

  const cols = [
    { label: dict.locale_label,  h: <span translate="no" className="notranslate">{dict.locale_h}</span>, lines: dict.locale_lines },
    { label: dict.coords_label,  h: dict.coords_h, lines: dict.coords_lines },
    { label: dict.hours_label,   h: dict.hours_h,  lines: dict.hours_lines  },
    ...((CONTACT_PHONE || CONTACT_EMAIL)
      ? [{ label: dict.contact_label, h: CONTACT_PHONE, lines: contactLines }]
      : []),
  ]

  return (
    <section style={{ background: 'var(--paper)', padding: 'clamp(64px,8vw,100px) var(--gutter)', borderTop: '1px solid rgba(31,26,20,0.18)' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div className="practical-grid">
          {cols.map(c => (
            <address key={c.label} style={{ fontStyle: 'normal' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 18 }}>
                {c.label}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(18px,2.2vw,24px)', lineHeight: 1.15, letterSpacing: '-0.005em', marginBottom: 22, color: 'var(--ink)' }}>
                {c.h}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--sans)', fontSize: 'clamp(12px,1.3vw,13.5px)', lineHeight: 1.85, color: 'var(--ink-soft)' }}>
                {c.lines.map(l => <li key={l}>{l}</li>)}
              </ul>
            </address>
          ))}
        </div>
      </div>
    </section>
  )
}
