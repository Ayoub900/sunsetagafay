import { GrainOverlay, SunburstMark } from '../shared'

interface ReviewItem { quote: string; name: string; stay: string; source: string }
interface ReviewsDict {
  eyebrow: string
  index: string
  title_1: string
  title_script: string
  lede: string
  items: ReviewItem[]
}

export function Reviews({ dict }: { dict: ReviewsDict }) {
  const count = dict.items.length
  const reviewsSchema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': 'https://sunsetagafay.com/#lodging',
    name: 'Sunset Agafay',
    url: 'https://sunsetagafay.com',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(count),
    },
    review: dict.items.map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      author: { '@type': 'Person', name: r.name },
      reviewBody: r.quote,
      publisher: r.source ? { '@type': 'Organization', name: r.source } : undefined,
    })),
  }

  return (
    <section
      style={{
        background: 'var(--paper)',
        padding: 'clamp(80px,10vw,140px) var(--gutter)',
        position: 'relative',
        borderTop: '1px solid rgba(31,26,20,0.12)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <GrainOverlay opacity={0.08} blend="multiply" style={{ zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto clamp(48px,7vw,80px)' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', justifyContent: 'center', marginBottom: 'clamp(20px,2.5vw,28px)' }}>
            {dict.eyebrow}
          </div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 400,
            fontSize: 'clamp(36px,5.5vw,68px)', lineHeight: 1,
            letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)',
          }}>
            {dict.title_1}{' '}
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
            color: 'var(--sienna)', margin: 'clamp(18px,2.5vw,28px) auto 0',
            maxWidth: 640,
          }}>
            {dict.lede}
          </p>
          <div style={{ marginTop: 'clamp(20px,2.5vw,28px)', display: 'flex', justifyContent: 'center' }}>
            <SunburstMark size={28} rays={14} stroke={1} color="var(--brass)" />
          </div>
        </div>

        {/* Cards */}
        <div className="reviews-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(20px,3vw,32px)',
        }}>
          {dict.items.map((r, i) => (
            <figure
              key={r.name}
              style={{
                margin: 0,
                background: 'var(--paper-deep)',
                padding: 'clamp(28px,3.5vw,40px)',
                border: '1px solid rgba(31,26,20,0.10)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <span aria-hidden="true" style={{
                position: 'absolute', top: 'clamp(14px,2vw,22px)', left: 'clamp(18px,2.4vw,28px)',
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(64px,7vw,96px)',
                lineHeight: 0.7, color: 'var(--brass)', opacity: 0.25, userSelect: 'none',
              }}>
                &ldquo;
              </span>

              {/* Stars */}
              <div aria-label="Five stars" style={{ display: 'flex', gap: 4, color: 'var(--brass)', marginBottom: 'clamp(18px,2.4vw,24px)', position: 'relative', zIndex: 1 }}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <span key={k} aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>★</span>
                ))}
              </div>

              <blockquote style={{
                margin: 0,
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(15px,1.6vw,17.5px)',
                lineHeight: 1.55,
                letterSpacing: '-0.003em',
                color: 'var(--ink)',
                position: 'relative',
                zIndex: 1,
                flex: 1,
              }}>
                {r.quote}
              </blockquote>

              <figcaption style={{
                marginTop: 'clamp(22px,3vw,32px)',
                paddingTop: 'clamp(16px,2vw,20px)',
                borderTop: '1px solid rgba(31,26,20,0.14)',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--script)', fontStyle: 'italic',
                    fontSize: 'clamp(22px,2.4vw,26px)', lineHeight: 1,
                    color: 'var(--brass)',
                  }}>
                    {r.name}
                  </div>
                  <div style={{
                    marginTop: 6,
                    fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em',
                    textTransform: 'uppercase', color: 'var(--ink-soft)',
                  }}>
                    {r.stay}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: 'var(--sienna)', whiteSpace: 'nowrap',
                }}>
                  · {r.source}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
