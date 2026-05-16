import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveTransfers } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.transfers_title,
    description: dict.meta.transfers_description,
    keywords: dict.meta.transfers_keywords,
    alternates: buildAlternates(lang, '/transfers'),
    openGraph: {
      title: dict.meta.transfers_title,
      description: dict.meta.transfers_description,
      url: `https://sunsetagafay.com/${lang}/transfers`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
      images: [{ url: '/og/transfers.jpg', width: 1200, height: 630, alt: 'Transfers — Sunset Agafay' }],
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function TransfersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbTransfers] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveTransfers(),
  ])
  const p = {
    ...dict.transfers_page,
    options: dbTransfers.length > 0
      ? dbTransfers.map(t => {
          const rawCopy = isFr ? t.copyFr : t.copyEn
          return {
            id:       t.slug,
            slug:     t.slug as string | undefined,
            name:     isFr ? t.nameFr : t.nameEn,
            lede:     isFr ? t.ledeFr : t.ledeEn,
            copy:     rawCopy.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            duration: t.duration,
            price:    t.price,
          }
        })
      : dict.transfers_page.options.map((o: { id: string; name: string; lede: string; copy: string; duration: string; price: string }) => ({ ...o, slug: undefined as string | undefined })),
  }

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="palms" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.4) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      {/* Transfer options */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px,0.3vw,4px)' }}>
            {p.options.map((opt, i) => (
              <article
                key={opt.id}
                id={opt.id}
                className="transfer-row"
                style={{
                  scrollMarginTop: 'var(--nav-h)',
                  padding: 'clamp(32px,4vw,52px) 0',
                  borderTop: '1px solid rgba(31,26,20,0.14)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 14 }}>
                    0{i + 1}
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(26px,3.5vw,44px)', lineHeight: 1.02, letterSpacing: '-0.015em', margin: 0, color: 'var(--ink)' }}>
                    {opt.slug ? (
                      <Link href={`/${lang}/transfers/${opt.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {opt.name}
                      </Link>
                    ) : opt.name}
                  </h2>
                  <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(10px,1.2vw,16px) 0 0', lineHeight: 1.4 }}>
                    {opt.lede}
                  </p>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,14.5px)', lineHeight: 1.75, color: 'var(--ink-soft)', margin: 'clamp(10px,1.5vw,16px) 0 0', maxWidth: 580 }}>
                    {opt.copy}
                  </p>
                  <div style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    {opt.slug && (
                      <Link href={`/${lang}/transfers/${opt.slug}`} className="cta">
                        <span className="cta-label">{lang === 'fr' ? 'Découvrir' : 'Discover'}</span>
                        <span className="cta-arrow" aria-hidden="true">→</span>
                      </Link>
                    )}
                    <Link href={`/${lang}/contact`} className="cta">
                      <span className="cta-label">{p.enquire_cta}</span>
                      <span className="cta-arrow" aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <div className="transfer-row-meta" style={{ textAlign: 'right', flexShrink: 0, paddingTop: 'clamp(28px,3vw,38px)' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
                    {lang === 'fr' ? 'Durée' : 'Duration'}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(15px,1.6vw,18px)', color: 'var(--ink)', marginBottom: 20 }}>
                    {opt.duration}
                  </div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
                    {lang === 'fr' ? 'Tarif' : 'Rate'}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--brass)' }}>
                    {opt.price}
                  </div>
                </div>
              </article>
            ))}
            <div style={{ borderTop: '1px solid rgba(31,26,20,0.14)' }} />
          </div>
        </div>
      </section>

      {/* Map info strip */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(48px,6vw,72px) var(--gutter)' }}>
        <GrainOverlay opacity={0.14} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(32px,4vw,56px)' }}>
          {[
            [lang === 'fr' ? 'Depuis' : 'From', 'Marrakech-Ménara Airport'],
            [lang === 'fr' ? 'Durée' : 'Journey', lang === 'fr' ? '~45 minutes' : '~45 minutes'],
            [lang === 'fr' ? 'Disponibilité' : 'Availability', lang === 'fr' ? '24h/24, 7j/7' : '24 hours, 7 days'],
            [lang === 'fr' ? 'Confirmation' : 'Confirmation', lang === 'fr' ? 'Sous 4 heures' : 'Within 4 hours'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 10 }}>{k}</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(17px,2vw,22px)', color: 'var(--paper)' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enquire CTA */}
      <section style={{ background: 'var(--sienna)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.18} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {p.enquire_cta}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.65)', margin: '0 0 40px', textTransform: 'uppercase' }}>
            {p.enquire_sub}
          </p>
          <Link href={`/${lang}/contact`} className="cta">
            <span className="cta-label">{p.enquire_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
