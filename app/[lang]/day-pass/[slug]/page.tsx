import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { Slideshow } from '@/components/Slideshow'
import { getActiveDayPasses, getDayPassBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'
import { ServiceBookingForm } from '@/components/ServiceBookingForm'

export async function generateStaticParams() {
  const items = await getActiveDayPasses()
  return items.map((p: { slug: string }) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}
  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getDayPassBySlug(slug),
  ])
  if (!item) return {}
  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const lede = (isFr ? item.ledeFr : item.ledeEn) || dict.meta.day_pass_description
  const plainLede = lede.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${name} — Sunset Agafay`,
    description: plainLede,
    keywords: dict.meta.day_pass_keywords,
    alternates: buildAlternates(lang, `/day-pass/${slug}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainLede,
      url: `https://sunsetagafay.com/${lang}/day-pass/${slug}`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'article',
      ...(item.imageUrl ? { images: [{ url: item.imageUrl, width: 1200, height: 630, alt: name }] } : {}),
    },
  }
}

export default async function DayPassDetailPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()

  const [dict, item, allPasses] = await Promise.all([
    getDictionary(lang as Locale),
    getDayPassBySlug(slug),
    getActiveDayPasses(),
  ])
  if (!item || !item.active) notFound()

  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const copy = isFr ? item.copyFr : item.copyEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const dp = dict.day_pass_page

  const cover = item.imageUrl || item.images?.[0] || undefined
  const heroImage = (item as { heroImageUrl?: string }).heroImageUrl || cover
  const galleryImages = (item.images ?? []).filter(Boolean)
  // Body slideshow falls back to the cover photo when no gallery was uploaded.
  const bodyImages = galleryImages.length ? galleryImages : (cover ? [cover] : [])

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dp.breadcrumb_home, item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: dp.breadcrumb_day_pass, item: `https://sunsetagafay.com/${lang}/day-pass` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/day-pass/${slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <style>{`
        .dp-wrap { background: var(--paper); padding: clamp(56px, 7vw, 88px) var(--gutter) clamp(64px, 9vw, 100px); }
        .dp-inner { max-width: var(--max-w); margin: 0 auto; }
        .dp-crumbs { font-family: var(--sans); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-soft); margin: 0 0 28px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .dp-crumbs a { color: inherit; text-decoration: none; opacity: 0.7; }
        .dp-crumbs a:hover { opacity: 1; }
        .dp-crumbs .sep { opacity: 0.4; }
        .dp-crumbs .cur { color: var(--ink); }

        .dp-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: clamp(36px, 5vw, 80px); align-items: start; }
        @media (max-width: 900px) { .dp-grid { grid-template-columns: 1fr; gap: 32px; } }

        .dp-gallery { display: flex; flex-direction: column; gap: 8px; }
        .dp-cover { position: relative; width: 100%; aspect-ratio: 4/3; overflow: hidden; border-radius: 2px; }
        .dp-thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .dp-thumb { position: relative; aspect-ratio: 1/1; overflow: hidden; border-radius: 2px; }
        .dp-thumb img, .dp-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

        .dp-content h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(28px, 3.5vw, 42px); line-height: 1.05; letter-spacing: -0.018em; color: var(--ink); margin: 0 0 18px; }
        .dp-eyebrow { font-family: var(--sans); font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--sienna); margin-bottom: 14px; }
        .dp-lede { font-family: var(--serif); font-style: italic; font-size: clamp(15px, 1.6vw, 18px); color: var(--sienna); margin: 0 0 22px; line-height: 1.45; }
        .dp-copy { font-family: var(--sans); font-size: 14.5px; line-height: 1.75; color: var(--ink-soft); margin: 0 0 24px; }
        .dp-copy p { margin: 0 0 14px; }
        .dp-welcome { font-family: var(--sans); font-size: 14px; font-weight: 600; color: var(--ink); margin: 0 0 24px; }

        /* The booking form ships its own styles (components/ServiceBookingForm). */
      `}</style>

      <section className="page-hero">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Photo
            kind="sunset"
            alt=""
            style={{ position: 'absolute', inset: 0 }}
            grain={false}
            priority
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(20,12,8,0.6) 0%, rgba(20,12,8,0.45) 60%, rgba(20,12,8,0.75) 100%)',
          }}
        />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4, maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>
            {dp.intro_eyebrow}
          </div>
          <h1 className="page-hero-title">{name}</h1>
          {lede && (
            <p
              className="page-hero-sub"
              dangerouslySetInnerHTML={{ __html: lede }}
            />
          )}
        </div>
      </section>

      <section className="dp-wrap">
        <div className="dp-inner">
          <nav className="dp-crumbs" aria-label="Breadcrumb">
            <Link href={`/${lang}`}>{dp.breadcrumb_home}</Link>
            <span className="sep" aria-hidden="true">/</span>
            <Link href={`/${lang}/day-pass`}>{dp.breadcrumb_day_pass}</Link>
            <span className="sep" aria-hidden="true">/</span>
            <span className="cur">{name}</span>
          </nav>

          <div className="dp-grid">
            <div className="dp-gallery">
              {bodyImages.length > 0 ? (
                <Slideshow images={bodyImages} alt={name} aspectRatio="4/3" />
              ) : (
                <div className="dp-cover">
                  <Photo kind="sunset" alt={name} style={{ position: 'absolute', inset: 0 }} />
                  <GrainOverlay opacity={0.16} blend="overlay" />
                </div>
              )}
            </div>

            <div className="dp-content">
              {copy && (
                <div className="dp-copy rich-content" dangerouslySetInnerHTML={{ __html: copy }} />
              )}
              {item.hours && (
                <p className="dp-welcome">
                  {dp.welcome_line} {item.hours}.
                </p>
              )}

              {/* Day passes are booked by card only. Without an online price
                  there is nothing to charge, so the page points at contact
                  rather than taking a booking it cannot settle. */}
              {item.priceMadCents > 0 ? (
                <ServiceBookingForm
                  kind="day-pass"
                  slug={item.slug}
                  lang={lang as 'en' | 'fr'}
                  itemName={name}
                  priceLabel={item.price ? `${item.currency || '€'} ${item.price}` : ''}
                  fromLabel={dp.price_label}
                  dict={dict.service_booking}
                  pay={dict.payment}
                />
              ) : (
                <p className="dp-welcome">
                  {dict.service_booking.unavailable}{' '}
                  <Link href={`/${lang}/contact`} style={{ color: 'var(--sienna)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {dict.service_booking.unavailable_cta}
                  </Link>
                </p>
              )}
            </div>
          </div>

          {allPasses.length > 1 && (
            <div style={{ marginTop: 'clamp(48px, 6vw, 80px)', paddingTop: 32, borderTop: '1px solid rgba(31,26,20,0.14)' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
                {dp.breadcrumb_day_pass}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {allPasses.map(p => {
                  const isCurrent = p.slug === slug
                  return (
                    <Link
                      key={p.slug}
                      href={`/${lang}/day-pass/${p.slug}`}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 3,
                        border: `1px solid ${isCurrent ? 'var(--ink)' : 'rgba(31,26,20,0.2)'}`,
                        background: isCurrent ? 'var(--ink)' : 'transparent',
                        color: isCurrent ? 'var(--paper)' : 'var(--ink)',
                        fontFamily: 'var(--sans)',
                        fontSize: 13,
                        textDecoration: 'none',
                      }}
                    >
                      {isFr ? p.nameFr : p.nameEn}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
