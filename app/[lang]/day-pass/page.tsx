import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveDayPasses } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.day_pass_title,
    description: dict.meta.day_pass_description,
    keywords: dict.meta.day_pass_keywords,
    alternates: buildAlternates(lang, '/day-pass'),
    openGraph: {
      title: dict.meta.day_pass_title,
      description: dict.meta.day_pass_description,
      url: `https://sunsetagafay.com/${lang}/day-pass`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

const kindMap = ['pool', 'palms', 'aperitif', 'sunset'] as const

type PassRow = {
  slug: string
  name: string
  lede: string
  hours: string
  price: string
  currency: string
  imageUrl?: string
}

export default async function DayPassIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbPasses] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveDayPasses(),
  ])
  const dp = dict.day_pass_page
  const passes: PassRow[] = dbPasses.map(d => ({
    slug:     d.slug,
    name:     isFr ? d.nameFr : d.nameEn,
    lede:     (isFr ? d.ledeFr : d.ledeEn) || '',
    hours:    d.hours || '',
    price:    d.price || '',
    currency: d.currency || '€',
    imageUrl: d.imageUrl || d.images?.[0] || undefined,
  }))

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="pool" src="/pool-palms-blue.webp" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.4) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{dp.hero_eyebrow}</div>
          <h1 className="page-hero-title">{dp.hero_title}</h1>
          <p className="page-hero-sub">{dp.hero_sub}</p>
        </div>
      </section>

      {passes.length > 0 ? (
        <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
          <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(80px,10vw,140px)' }}>
            {passes.map((d, i) => (
              <article
                key={d.slug}
                id={d.slug}
                style={{
                  scrollMarginTop: 'var(--nav-h)',
                  display: 'grid',
                  gridTemplateColumns: i % 2 === 0 ? '1.1fr 1fr' : '1fr 1.1fr',
                  gap: 'clamp(32px,5vw,80px)',
                  alignItems: 'center',
                }}
                className="table-article"
              >
                {i % 2 === 0 ? (
                  <>
                    <PassText d={d} dp={dp} lang={lang} index={i} />
                    <PassPhoto d={d} i={i} />
                  </>
                ) : (
                  <>
                    <PassPhoto d={d} i={i} />
                    <PassText d={d} dp={dp} lang={lang} index={i} />
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(18px,2vw,22px)', color: 'var(--ink-soft)', margin: 0 }}>
            {isFr ? 'Aucun day pass disponible pour le moment.' : 'No day passes available at the moment.'}
          </p>
        </section>
      )}

      {/* Reserve CTA */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center', position: 'relative' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {dp.reserve_cta}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.55)', margin: '0 0 40px', textTransform: 'uppercase' }}>
            {dp.reserve_cta_sub}
          </p>
          {/* Day passes are booked and paid by card on the pass's own page, so
              this leads there rather than to an enquiry form. */}
          <Link href={passes[0] ? `/${lang}/day-pass/${passes[0].slug}` : `/${lang}/contact`} className="cta">
            <span className="cta-label">{dp.reserve_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function PassPhoto({ d, i }: { d: PassRow; i: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
      <Photo kind={kindMap[i % kindMap.length]} src={d.imageUrl || undefined} alt={d.name} style={{ position: 'absolute', inset: 0 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--paper)', opacity: 0.85, zIndex: 4 }}>
        № 0{i + 1}
      </div>
    </div>
  )
}

function PassText({ d, dp, lang, index }: {
  d: PassRow
  dp: {
    hours_label: string
    price_label: string
    discover_cta: string
    reserve_cta: string
    from: string
  }
  lang: string
  index: number
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 18 }}>
        № 0{index + 1}
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
        <Link href={`/${lang}/day-pass/${d.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          {d.name}
        </Link>
      </h2>
      {d.lede && (
        <p
          style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0', lineHeight: 1.45 }}
          dangerouslySetInnerHTML={{ __html: d.lede }}
        />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>
            {dp.hours_label}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)' }}>
            {d.hours || '—'}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>
            {dp.price_label}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)' }}>
            {d.price ? `${d.currency} ${d.price}` : '—'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Link href={`/${lang}/day-pass/${d.slug}`} className="cta">
          <span className="cta-label">{dp.discover_cta}</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
