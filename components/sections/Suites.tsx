import Link from 'next/link'
import { Photo, SectionHead } from '../shared'

interface Room { slug?: string; name: string; brief: string; area: string; view: string; rate: string; imageUrl?: string; imageKind?: string }
interface SuitesSectionDict {
  eyebrow: string; index: string; title: string; lede: string; from_night: string; discover: string; reserve?: string; details?: string
}

const kindMap = ['palms', 'courtyard', 'sunset', 'aperitif'] as const

export function Suites({ dict, rooms, lang }: { dict: SuitesSectionDict; rooms: Room[]; lang: string }) {
  return (
    <section style={{ background: 'var(--paper)', padding: 'clamp(80px,10vw,120px) var(--gutter)' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <SectionHead
          index={dict.index}
          eyebrow={dict.eyebrow}
          title={dict.title}
          lede={dict.lede}
        />
        <div className="suites-grid" style={{ marginTop: 'clamp(32px,4vw,48px)' }}>
          {rooms.map((r, i) => (
            <article key={r.name} id={`${r.name.toLowerCase().replace(/\s+/g, '-').replace(/[éè]/g, 'e')}`}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5' }}>
                <Photo
                  kind={(r.imageKind as (typeof kindMap)[number]) || kindMap[i % kindMap.length]}
                  src={r.imageUrl || undefined}
                  alt={r.name}
                  style={{ position: 'absolute', inset: 0 }}
                />
              </div>
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(20px,2vw,26px)', lineHeight: 1.05, letterSpacing: '-0.01em', margin: 0, color: 'var(--ink)' }}>
                  {r.name}
                </h3>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                  {r.area}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.3vw,13.5px)', lineHeight: 1.65, color: 'var(--ink-soft)', margin: '10px 0 0' }}>
                {r.brief}
              </p>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(31,26,20,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  {dict.from_night}
                </span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(18px,2vw,22px)', color: 'var(--brass)' }}>
                  {r.rate}
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <Link
                  href={`/${lang}/reserve`}
                  className="cta"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className="cta-label">{dict.reserve ?? 'Reserve'}</span>
                  <span className="cta-arrow" aria-hidden="true">→</span>
                </Link>
                {r.slug && (
                  <Link
                    href={`/${lang}/suites/${r.slug}`}
                    style={{
                      flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '11px 16px',
                      fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: 'var(--ink)', border: '1px solid rgba(31,26,20,0.3)', textDecoration: 'none',
                    }}
                  >
                    {dict.details ?? 'Details'}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 'clamp(40px,5vw,64px)', display: 'flex', justifyContent: 'center' }}>
          <Link href={`/${lang}/suites`} className="cta">
            <span className="cta-label">{dict.discover}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
