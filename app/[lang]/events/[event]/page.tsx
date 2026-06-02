import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveEvents, getEventBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  const items = await getActiveEvents()
  return items.map(e => ({ event: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; event: string }> }): Promise<Metadata> {
  const { lang, event } = await params
  if (!hasLocale(lang)) return {}
  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getEventBySlug(event),
  ])
  if (!item) return {}
  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const copy = isFr ? item.copyFr : item.copyEn
  const plainCopy = copy.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${name} — Sunset Agafay`,
    description: plainCopy,
    keywords: dict.meta.events_keywords,
    alternates: buildAlternates(lang, `/events/${event}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainCopy,
      url: `https://sunsetagafay.com/${lang}/events/${event}`,
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

export default async function EventDetailPage({ params }: { params: Promise<{ lang: string; event: string }> }) {
  const { lang, event } = await params
  if (!hasLocale(lang)) notFound()

  const [, item] = await Promise.all([
    getDictionary(lang as Locale),
    getEventBySlug(event),
  ])
  if (!item || !item.active) notFound()

  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const copy = isFr ? item.copyFr : item.copyEn

  const coverImage = item.imageUrl || undefined
  const galleryImages = item.images ?? []
  const thumb1 = galleryImages[1] || undefined
  const thumb2 = galleryImages[2] || undefined

  const plainCopy = copy.replace(/<[^>]+>/g, '').slice(0, 200)
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${name} at Sunset Agafay`,
    description: plainCopy,
    url: `https://sunsetagafay.com/${lang}/events/${event}`,
    location: {
      '@type': 'Place',
      name: 'Sunset Agafay',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Lot Chaabat Ssi Laaroussi, Douar Lamlih, Commune et Caïdat Agafay, Cercle Loudaya',
        addressLocality: 'Agafay',
        addressRegion: 'Marrakech-Safi',
        postalCode: '40000',
        addressCountry: 'MA',
      },
    },
    organizer: { '@type': 'Organization', name: 'Sunset Agafay', url: 'https://sunsetagafay.com' },
    image: coverImage ? `https://sunsetagafay.com${coverImage.startsWith('/') ? '' : '/'}${coverImage}` : 'https://sunsetagafay.com/logo_gold.png',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: isFr ? 'Événements' : 'Events', item: `https://sunsetagafay.com/${lang}/events` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/events/${event}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--paper)' }}>
      <section className="page-hero">
        <Photo kind="courtyard" src={coverImage} alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.6) 0%, rgba(20,12,8,0.45) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>
            {isFr ? 'Événement Privé' : 'Private Event'}
          </div>
          <h1 className="page-hero-title">{name}</h1>
          <p className="page-hero-sub">
            {isFr ? `Jusqu'à ${item.capacity} invités.` : `Up to ${item.capacity} guests.`}
          </p>
        </div>
      </section>

      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 'clamp(40px,6vw,96px)', alignItems: 'start' }} className="table-article">
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 20 }}>
              {isFr ? 'Format d\'Événement' : 'Event Format'}
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(28px,3.5vw,44px)', lineHeight: 1, letterSpacing: '-0.018em', margin: '0 0 clamp(20px,2.5vw,32px)', color: 'var(--ink)' }}>
              {name}
            </h2>
            <div
              className="rich-content"
              style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}
              dangerouslySetInnerHTML={{ __html: copy }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
              {[
                [isFr ? 'Capacité' : 'Capacity', item.capacity],
                [isFr ? 'Lieu' : 'Venue', isFr ? 'Kasbah complète' : 'Full kasbah'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36 }}>
              <Link href={`/${lang}/contact`} className="cta">
                <span className="cta-label">{isFr ? 'Nous contacter' : 'Enquire Now'}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
              <Photo kind="courtyard" src={coverImage} alt={name} style={{ position: 'absolute', inset: 0 }} />
            </div>
            {(thumb1 || thumb2) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
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
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4.5vw,56px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {isFr ? 'Planifiez votre événement.' : 'Plan your event.'}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.55)', margin: '0 0 40px', textTransform: 'uppercase' }}>
            {isFr ? 'Réponse sous 24 heures' : 'We respond within 24 hours'}
          </p>
          <Link href={`/${lang}/contact`} className="cta">
            <span className="cta-label">{isFr ? 'Commencer la conversation' : 'Start the Conversation'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
