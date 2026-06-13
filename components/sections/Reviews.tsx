import { GrainOverlay, SunburstMark } from '../shared'
import { ReviewCard } from './ReviewCard'

interface ReviewItem { quote: string; name: string; stay: string; source: string }
interface ReviewsDict {
  eyebrow: string
  index: string
  title_1: string
  title_script: string
  lede: string
  items: ReviewItem[]
}

export function Reviews({ dict, lang }: { dict: ReviewsDict; lang: string }) {
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
          {dict.items.map(r => (
            <ReviewCard key={r.name} r={r} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
