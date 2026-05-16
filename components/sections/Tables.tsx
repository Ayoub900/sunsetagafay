import Link from 'next/link'
import { Photo, SectionHead } from '../shared'

interface TableEntry { n: string; name: string; lede: string; hours: string; imageUrl?: string }
interface TablesSectionDict { eyebrow: string; index: string; title: string; lede: string; service: string }

const kinds = ['courtyard', 'aperitif', 'palms'] as const
const anchors = ['le-souk', 'bar-arish', 'la-table-didriss']

export function Tables({ dict, tables, lang }: { dict: TablesSectionDict; tables: TableEntry[]; lang: string }) {
  return (
    <section style={{ background: 'var(--paper-deep)', padding: 'clamp(80px,10vw,120px) var(--gutter)' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <SectionHead index={dict.index} eyebrow={dict.eyebrow} title={dict.title} lede={dict.lede} />

        <div style={{ marginTop: 'clamp(48px,7vw,80px)', display: 'flex', flexDirection: 'column', gap: 'clamp(56px,8vw,96px)' }}>
          {tables.map((t, i) => (
            <article key={t.name} id={anchors[i]} className={`table-entry ${i % 2 === 0 ? 'left' : 'right'}`} style={{ scrollMarginTop: 'var(--nav-h)' }}>
              {i % 2 === 0 ? (
                <>
                  <div className="table-photo" style={{ position: 'relative', width: '100%', aspectRatio: '5 / 4' }}>
                    <Photo kind={kinds[i]} src={t.imageUrl || undefined} alt={t.name} style={{ position: 'absolute', inset: 0 }} />
                  </div>
                  <TableText t={t} service={dict.service} lang={lang} anchor={anchors[i]} />
                </>
              ) : (
                <>
                  <TableText t={t} service={dict.service} lang={lang} anchor={anchors[i]} />
                  <div className="table-photo" style={{ position: 'relative', width: '100%', aspectRatio: '5 / 4' }}>
                    <Photo kind={kinds[i]} src={t.imageUrl || undefined} alt={t.name} style={{ position: 'absolute', inset: 0 }} />
                  </div>
                </>
              )}
            </article>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(48px,6vw,80px)', display: 'flex', justifyContent: 'center' }}>
          <Link href={`/${lang}/restaurants`} className="cta">
            <span className="cta-label">{lang === 'fr' ? 'Toutes les tables' : 'All Tables'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function TableText({ t, service, lang, anchor }: { t: TableEntry; service: string; lang: string; anchor: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 18 }}>
        Table No. {t.n}
      </div>
      <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
        {t.name}
      </h3>
      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(17px,2vw,20px)', lineHeight: 1.45, color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0', maxWidth: 520 }}>
        {t.lede}
      </p>
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(31,26,20,0.18)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{service}</span>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.5vw,16px)', color: 'var(--ink)' }}>{t.hours}</span>
      </div>
      <div style={{ marginTop: 28 }}>
        <Link href={`/${lang}/restaurants/${anchor}`} className="cta">
          <span className="cta-label">{lang === 'fr' ? 'Découvrir' : 'Discover'}</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
