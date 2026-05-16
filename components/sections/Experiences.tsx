import { SectionHead } from '../shared'
import Link from 'next/link'

interface ExpItem { n: string; name: string; when: string; who: string; lede: string; imageUrl?: string }
interface ExpSectionDict { eyebrow: string; index: string; title: string; lede: string }

export function Experiences({ dict, experiences, lang }: { dict: ExpSectionDict; experiences: ExpItem[]; lang: string }) {
  return (
    <section style={{ background: 'var(--paper)', padding: 'clamp(80px,10vw,120px) var(--gutter)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHead index={dict.index} eyebrow={dict.eyebrow} title={dict.title} lede={dict.lede} />
        <ul style={{ listStyle: 'none', margin: 'clamp(20px,3vw,32px) 0 0', padding: 0, color: 'var(--ink)' }} role="list">
          {experiences.map(it => (
            <li key={it.n} className="exp-row">
              {it.imageUrl && (
                <div style={{
                  width: 64, height: 64, flexShrink: 0,
                  borderRadius: 4, overflow: 'hidden',
                  display: 'none',
                }} className="exp-row-thumb">
                  <img src={it.imageUrl} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              )}
              <span className="exp-row-num" style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.28em', color: 'var(--sienna)' }}>
                № {it.n}
              </span>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(22px,3vw,32px)', lineHeight: 1.05, letterSpacing: '-0.01em' }}>
                {it.name}
              </span>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.6vw,17px)', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                {it.lede}
              </span>
              <div className="exp-row-when" style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  {it.when}
                </div>
                <div className="exp-row-who" style={{ marginTop: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(12px,1.3vw,14px)', color: 'var(--ink)' }}>
                  {it.who}
                </div>
              </div>
              <Link
                href={`/${lang}/experiences`}
                aria-label={`${lang === 'fr' ? 'En savoir plus' : 'Learn more'}: ${it.name}`}
                className="exp-row-arrow"
              >
                →
              </Link>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 'clamp(40px,5vw,64px)', display: 'flex', justifyContent: 'center' }}>
          <Link href={`/${lang}/experiences`} className="cta">
            <span className="cta-label">{lang === 'fr' ? 'Toutes les expériences' : 'All Experiences'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
