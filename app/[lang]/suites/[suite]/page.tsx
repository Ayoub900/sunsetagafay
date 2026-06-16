import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { Slideshow } from '@/components/Slideshow'
import { getActiveSuites, getSuiteBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  const suites = await getActiveSuites()
  return suites.map(s => ({ suite: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; suite: string }> }): Promise<Metadata> {
  const { lang, suite: suiteSlug } = await params
  if (!hasLocale(lang)) return {}
  const [dict, suite] = await Promise.all([
    getDictionary(lang as Locale),
    getSuiteBySlug(suiteSlug),
  ])
  if (!suite) return {}
  const isFr = lang === 'fr'
  const name = isFr ? suite.nameFr : suite.nameEn
  const brief = isFr ? suite.briefFr : suite.briefEn
  const plainBrief = brief.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${name} — Sunset Agafay`,
    description: plainBrief,
    keywords: dict.meta.suites_keywords,
    alternates: buildAlternates(lang, `/suites/${suiteSlug}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainBrief,
      url: `https://sunsetagafay.com/${lang}/suites/${suiteSlug}`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'article',
      ...(suite.imageUrl ? { images: [{ url: suite.imageUrl, width: 1200, height: 630, alt: name }] } : {}),
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function SuiteDetailPage({ params }: { params: Promise<{ lang: string; suite: string }> }) {
  const { lang, suite: suiteSlug } = await params
  if (!hasLocale(lang)) notFound()

  const [dict, suite] = await Promise.all([
    getDictionary(lang as Locale),
    getSuiteBySlug(suiteSlug),
  ])
  if (!suite || !suite.active) notFound()

  const isFr = lang === 'fr'
  const p = dict.suites_page
  const name = isFr ? suite.nameFr : suite.nameEn
  const brief = isFr ? suite.briefFr : suite.briefEn
  const description = isFr
    ? (suite as { descriptionFr?: string }).descriptionFr || ''
    : (suite as { descriptionEn?: string }).descriptionEn || ''

  const coverImage = suite.imageUrl || undefined
  const heroImage = (suite as { heroImageUrl?: string }).heroImageUrl || coverImage
  const galleryImages = ((suite as { images?: string[] }).images ?? []).filter(Boolean)
  // Body slideshow falls back to the cover photo when no gallery was uploaded.
  const bodyImages = galleryImages.length ? galleryImages : (coverImage ? [coverImage] : [])
  const plainBrief = brief.replace(/<[^>]+>/g, '').slice(0, 160)

  const hotelRoomSchema = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name,
    description: plainBrief,
    url: `https://sunsetagafay.com/${lang}/suites/${suiteSlug}`,
    image: suite.imageUrl ? `https://sunsetagafay.com${suite.imageUrl.startsWith('/') ? '' : '/'}${suite.imageUrl}` : 'https://sunsetagafay.com/logo_gold.png',
    floorSize: { '@type': 'QuantitativeValue', value: suite.area?.replace(/[^\d]/g, ''), unitCode: 'MTK' },
    containedInPlace: { '@type': 'Hotel', name: 'Sunset Agafay', url: 'https://sunsetagafay.com' },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: isFr ? 'Suites' : 'Suites', item: `https://sunsetagafay.com/${lang}/suites` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/suites/${suiteSlug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelRoomSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo
          kind={(suite.imageKind as 'sunset' | 'palms' | 'pool' | 'courtyard' | 'aperitif') || 'palms'}
          src={heroImage}
          alt=""
          style={{ position: 'absolute', inset: 0 }}
          grain={false}
          priority
        />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.6) 0%, rgba(20,12,8,0.45) 60%, rgba(20,12,8,0.75) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <h1 className="page-hero-title">{name}</h1>
          <p
            className="page-hero-sub"
            dangerouslySetInnerHTML={{ __html: brief }}
          />
        </div>
      </section>

      {/* Detail content */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(40px,6vw,96px)', alignItems: 'start' }} className="table-article">
          {/* Photo column */}
          <div>
            {bodyImages.length > 0 ? (
              <Slideshow images={bodyImages} alt={name} />
            ) : (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                <Photo
                  kind={(suite.imageKind as 'sunset' | 'palms' | 'pool' | 'courtyard' | 'aperitif') || 'sunset'}
                  src={coverImage}
                  alt={name}
                  style={{ position: 'absolute', inset: 0 }}
                />
              </div>
            )}
          </div>

          {/* Text column */}
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 20 }}>
              {isFr ? 'La Suite' : 'The Suite'}
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(28px,3.5vw,44px)', lineHeight: 1, letterSpacing: '-0.018em', margin: '0 0 clamp(20px,2.5vw,32px)', color: 'var(--ink)' }}>
              {name}
            </h2>

            <div
              className="rich-content"
              style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}
              dangerouslySetInnerHTML={{ __html: description || brief }}
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
              {([
                [p.area_label,  suite.area],
                [p.view_label,  suite.view],
                [isFr ? 'Tarif' : 'Rate', suite.rate + (isFr ? ' / nuit' : ' / night')],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Rate + CTA */}
            <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(31,26,20,0.14)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{p.from_night}</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,3vw,32px)', color: 'var(--brass)' }}>{suite.rate}</span>
              </div>
              <Link href={`/${lang}/reserve`} className="cta">
                <span className="cta-label">{p.reserve_cta}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other suites CTA */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(48px,6vw,72px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.55)', margin: '0 0 20px' }}>
            {isFr ? 'Voir toutes les suites' : 'See all suites'}
          </p>
          <Link href={`/${lang}/suites`} className="cta">
            <span className="cta-label">{isFr ? 'Toutes les chambres' : 'All Rooms'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
