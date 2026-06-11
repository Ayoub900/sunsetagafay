import { GrainOverlay } from '../shared'
import Link from 'next/link'

interface Treatment { name: string; duration: string; price: string }
interface HammamDict {
  eyebrow: string; title_1: string; title_script: string; lede: string; cta: string
  treatments: Treatment[]
}

export function Hammam({ dict, lang }: { dict: HammamDict; lang: string }) {
  return (
    <section style={{ background: 'var(--paper-deep)', padding: 'clamp(80px,10vw,140px) var(--gutter)', position: 'relative' }}>
      <GrainOverlay opacity={0.1} blend="multiply" style={{ zIndex: 1 }} />
      <div className="hammam-grid" style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto' }}>
        <div>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 'clamp(20px,2.5vw,28px)' }}>
            {dict.eyebrow}
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
            {dict.title_1}<br />
            <span style={{ fontFamily: 'var(--script)', fontStyle: 'italic', fontSize: '1.2em', lineHeight: 0.7, color: 'var(--brass)' }}>
              {dict.title_script}
            </span>
          </h2>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(17px,2vw,20px)', lineHeight: 1.5, color: 'var(--sienna)', margin: 'clamp(20px,3vw,28px) 0 0', maxWidth: 560 }}>
            {dict.lede}
          </p>
          <ul style={{ listStyle: 'none', margin: 'clamp(28px,4vw,44px) 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(12px,2vw,18px) clamp(24px,4vw,56px)', maxWidth: 640 }} role="list">
            {dict.treatments.map(t => (
              <li key={t.name} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(31,26,20,0.18)' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(15px,1.6vw,17px)', color: 'var(--ink)' }}>{t.name}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-soft)', whiteSpace: 'nowrap', paddingLeft: 8 }}>
                  {t.duration} · {t.price}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'clamp(28px,4vw,44px)' }}>
            <Link href={`/${lang}/experiences`} className="cta">
              <span className="cta-label">{dict.cta}</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="hammam-frame" style={{ width: '100%', aspectRatio: '3 / 5', position: 'relative', overflow: 'hidden' }}>
          <img
            src="/suite-tent-interior.webp"
            alt="Tented suite interior at Sunset Agafay"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
            loading="lazy"
          />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to top, rgba(20,12,8,0.55), transparent 45%)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: 18, bottom: 14, color: 'var(--paper)', fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.18em', opacity: 0.85, zIndex: 4 }}>
            PLATE V · QUIET HOURS
          </div>
        </div>
      </div>
    </section>
  )
}
