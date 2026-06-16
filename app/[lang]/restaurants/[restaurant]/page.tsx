import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { Slideshow } from '@/components/Slideshow'
import { RestaurantMenu, type RestaurantMenuDict } from '@/components/sections/RestaurantMenu'
import { getActiveRestaurants, getRestaurantBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  const items = await getActiveRestaurants()
  return items.map(r => ({ restaurant: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; restaurant: string }> }): Promise<Metadata> {
  const { lang, restaurant } = await params
  if (!hasLocale(lang)) return {}
  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getRestaurantBySlug(restaurant),
  ])
  if (!item) return {}
  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const plainLede = lede.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${name} — Sunset Agafay`,
    description: plainLede,
    keywords: dict.meta.restaurants_keywords,
    alternates: buildAlternates(lang, `/restaurants/${restaurant}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainLede,
      url: `https://sunsetagafay.com/${lang}/restaurants/${restaurant}`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'article',
      ...(item.imageUrl ? { images: [{ url: item.imageUrl, width: 1200, height: 630, alt: name }] } : {}),
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ lang: string; restaurant: string }> }) {
  const { lang, restaurant } = await params
  if (!hasLocale(lang)) notFound()

  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getRestaurantBySlug(restaurant),
  ])
  if (!item || !item.active) notFound()

  const isFr = lang === 'fr'
  const p = dict.restaurants_page
  const ts = dict.tables_section
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const copy = isFr ? item.copyFr : item.copyEn

  const coverImage = item.imageUrl || undefined
  const heroImage = (item as { heroImageUrl?: string }).heroImageUrl || coverImage
  const galleryImages = (item.images ?? []).filter(Boolean)
  // Body slideshow falls back to the cover photo when no gallery was uploaded.
  const bodyImages = galleryImages.length ? galleryImages : (coverImage ? [coverImage] : [])

  const restaurantSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    description: lede.replace(/<[^>]+>/g, '').slice(0, 200),
    url: `https://sunsetagafay.com/${lang}/restaurants/${restaurant}`,
    servesCuisine: 'Moroccan',
    openingHours: item.hours,
    priceRange: '€€€',
    image: coverImage ? `https://sunsetagafay.com${coverImage.startsWith('/') ? '' : '/'}${coverImage}` : 'https://sunsetagafay.com/logo_gold.png',
    containedInPlace: { '@type': 'Hotel', name: 'Sunset Agafay', url: 'https://sunsetagafay.com' },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: isFr ? 'Restaurants & Bars' : 'Restaurants & Bars', item: `https://sunsetagafay.com/${lang}/restaurants` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/restaurants/${restaurant}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--paper)' }}>
      <section className="page-hero">
        <Photo kind="aperitif" src={heroImage} alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.4) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <h1 className="page-hero-title">{name}</h1>
          <p className="page-hero-sub" dangerouslySetInnerHTML={{ __html: lede }} />
        </div>
      </section>

      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 'clamp(40px,6vw,96px)', alignItems: 'start' }} className="table-article">
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(28px,3.5vw,44px)', lineHeight: 1, letterSpacing: '-0.018em', margin: '0 0 clamp(20px,2.5vw,32px)', color: 'var(--ink)' }}>
              {name}
            </h2>
            <div
              className="rich-content"
              style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}
              dangerouslySetInnerHTML={{ __html: copy || lede }}
            />

            <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{ts.service}</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{item.hours}</div>
            </div>

            <div style={{ marginTop: 36 }}>
              <Link href={`/${lang}/contact?table=${encodeURIComponent(name)}`} className="cta">
                <span className="cta-label">{p.reserve_cta}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div>
            {bodyImages.length > 0 ? (
              <Slideshow images={bodyImages} alt={name} />
            ) : (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                <Photo kind="palms" src={coverImage} alt={name} style={{ position: 'absolute', inset: 0 }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {(p as { menu?: RestaurantMenuDict }).menu && (
        <RestaurantMenu dict={(p as { menu: RestaurantMenuDict }).menu} />
      )}

      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4.5vw,56px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {p.reserve_cta}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.55)', margin: '0 0 40px', textTransform: 'uppercase' }}>
            {p.reserve_cta_sub}
          </p>
          <Link href={`/${lang}/contact?table=${encodeURIComponent(name)}`} className="cta">
            <span className="cta-label">{p.reserve_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
