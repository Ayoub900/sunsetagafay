import Link from 'next/link'

interface FAQItem { q: string; a: string }
interface FAQDict {
  eyebrow: string
  index: string
  title_1: string
  title_script: string
  lede: string
  contact_cta: string
  items: FAQItem[]
}

export function FAQ({ dict, lang }: { dict: FAQDict; lang: string }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang === 'fr' ? 'fr-FR' : 'en-US',
    mainEntity: dict.items.map(it => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <section
      id="faq"
      style={{
        background: 'var(--paper-deep)',
        padding: 'clamp(80px,10vw,140px) var(--gutter)',
        borderTop: '1px solid rgba(31,26,20,0.12)',
        scrollMarginTop: 'var(--nav-h)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="faq-grid" style={{
        maxWidth: 'var(--max-w)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
        gap: 'clamp(40px,6vw,80px)',
        alignItems: 'start',
      }}>

        {/* Left — heading */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 'clamp(20px,2.5vw,28px)' }}>
            {dict.eyebrow}
          </div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 400,
            fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1,
            letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)',
          }}>
            {dict.title_1}<br />
            <span style={{
              fontFamily: 'var(--script)', fontStyle: 'italic',
              color: 'var(--brass)', fontSize: '1.15em', lineHeight: 0.7,
            }}>
              {dict.title_script}
            </span>
          </h2>
          <p style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 'clamp(16px,1.8vw,19px)', lineHeight: 1.5,
            color: 'var(--sienna)', margin: 'clamp(20px,3vw,28px) 0 0',
            maxWidth: 460,
          }}>
            {dict.lede}
          </p>
          <div style={{ marginTop: 'clamp(28px,4vw,40px)' }}>
            <Link href={`/${lang}/contact`} className="cta">
              <span className="cta-label">{dict.contact_cta}</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Right — questions */}
        <div>
          <ul style={{
            listStyle: 'none', margin: 0, padding: 0,
            borderTop: '1px solid rgba(31,26,20,0.18)',
          }}>
            {dict.items.map((it, i) => (
              <li key={i} style={{ borderBottom: '1px solid rgba(31,26,20,0.18)' }}>
                <details style={{ padding: 'clamp(20px,2.6vw,28px) 0' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      listStyle: 'none',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      fontFamily: 'var(--serif)',
                      fontSize: 'clamp(18px,2.1vw,22px)',
                      lineHeight: 1.3,
                      letterSpacing: '-0.005em',
                      color: 'var(--ink)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'clamp(14px,2vw,22px)' }}>
                      <span style={{
                        fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em',
                        textTransform: 'uppercase', color: 'var(--sienna)', flexShrink: 0,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{it.q}</span>
                    </span>
                    <span aria-hidden="true" className="faq-icon" style={{
                      flexShrink: 0,
                      width: 22, height: 22,
                      position: 'relative',
                      color: 'var(--brass)',
                    }} />
                  </summary>
                  <div style={{
                    marginTop: 'clamp(14px,2vw,20px)',
                    paddingLeft: 'clamp(0px,4vw,52px)',
                    fontFamily: 'var(--sans)',
                    fontSize: 'clamp(14px,1.4vw,14.5px)',
                    lineHeight: 1.75,
                    color: 'var(--ink-soft)',
                    maxWidth: 640,
                  }}>
                    {it.a}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
