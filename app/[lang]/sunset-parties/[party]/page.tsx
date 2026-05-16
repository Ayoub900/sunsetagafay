import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveSunsetParties, getSunsetPartyBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  const items = await getActiveSunsetParties()
  return items.map(p => ({ party: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; party: string }> }): Promise<Metadata> {
  const { lang, party } = await params
  if (!hasLocale(lang)) return {}
  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getSunsetPartyBySlug(party),
  ])
  if (!item) return {}
  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const plainLede = lede.replace(/<[^>]+>/g, '').slice(0, 160)
  const ogImage = item.imageUrl || '/og/sunset-parties.jpg'
  return {
    title: `${name} — Sunset Agafay`,
    description: plainLede,
    keywords: dict.meta.sunset_parties_keywords,
    alternates: buildAlternates(lang, `/sunset-parties/${party}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainLede,
      url: `https://sunsetagafay.com/${lang}/sunset-parties/${party}`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function PartyDetailPage({ params }: { params: Promise<{ lang: string; party: string }> }) {
  const { lang, party } = await params
  if (!hasLocale(lang)) notFound()

  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getSunsetPartyBySlug(party),
  ])
  if (!item || !item.active) notFound()

  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const copy = isFr ? item.copyFr : item.copyEn

  const coverImage = item.imageUrl || undefined
  const galleryImages = item.images ?? []
  const thumb1 = galleryImages[1] || undefined
  const thumb2 = galleryImages[2] || undefined

  const plainCopy = copy.replace(/<[^>]+>/g, '').slice(0, 200)
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description: plainCopy,
    url: `https://sunsetagafay.com/${lang}/sunset-parties/${party}`,
    location: {
      '@type': 'Place',
      name: 'Sunset Agafay',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Agafay',
        addressRegion: 'Marrakech-Safi',
        postalCode: '42150',
        addressCountry: 'MA',
      },
    },
    organizer: { '@type': 'Organization', name: 'Sunset Agafay', url: 'https://sunsetagafay.com' },
    image: coverImage ? `https://sunsetagafay.com${coverImage.startsWith('/') ? '' : '/'}${coverImage}` : 'https://sunsetagafay.com/og/sunset-parties.jpg',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: isFr ? 'Soirées' : 'Sunset Parties', item: `https://sunsetagafay.com/${lang}/sunset-parties` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/sunset-parties/${party}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--paper)' }}>
      <section className="page-hero">
        <Photo kind="sunset" src={coverImage} alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.5) 0%, rgba(20,12,8,0.35) 55%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>
            {isFr ? 'Soirée' : 'Party'}
          </div>
          <h1 className="page-hero-title">{name}</h1>
          <p className="page-hero-sub" dangerouslySetInnerHTML={{ __html: lede }} />
        </div>
      </section>

      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(40px,6vw,96px)', alignItems: 'start' }} className="table-article">
          <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
              <Photo kind="aperitif" src={coverImage} alt={name} style={{ position: 'absolute', inset: 0 }} />
            </div>
            {(thumb1 || thumb2) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 2 }}>
                {thumb1 && (
                  <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                    <img src={thumb1} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {thumb2 && (
                  <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                    <img src={thumb2} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 20 }}>
              {isFr ? 'La Soirée' : 'The Party'}
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(28px,3.5vw,44px)', lineHeight: 1, letterSpacing: '-0.018em', margin: '0 0 clamp(20px,2.5vw,32px)', color: 'var(--ink)' }}>
              {name}
            </h2>
            <div
              className="rich-content"
              style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}
              dangerouslySetInnerHTML={{ __html: copy || lede }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
              {[
                [isFr ? 'Capacité' : 'Capacity', item.capacity],
                [isFr ? 'Saison' : 'Season', item.season],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36 }}>
              <Link href={`/${lang}/contact`} className="cta">
                <span className="cta-label">{dict.sunset_parties_page.enquire_cta}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(48px,6vw,72px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.55)', margin: '0 0 20px' }}>
            {isFr ? 'Voir toutes les soirées' : 'See all party formats'}
          </p>
          <Link href={`/${lang}/sunset-parties`} className="cta">
            <span className="cta-label">{isFr ? 'Toutes les soirées' : 'All Parties'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
