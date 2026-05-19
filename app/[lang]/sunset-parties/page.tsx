import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveSunsetParties, arePartiesEnabled } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.sunset_parties_title,
    description: dict.meta.sunset_parties_description,
    keywords: dict.meta.sunset_parties_keywords,
    alternates: buildAlternates(lang, '/sunset-parties'),
    openGraph: {
      title: dict.meta.sunset_parties_title,
      description: dict.meta.sunset_parties_description,
      url: `https://sunsetagafay.com/${lang}/sunset-parties`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

const kindMap = ['sunset', 'pool', 'aperitif'] as const

export default async function SunsetPartiesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (!(await arePartiesEnabled())) notFound()
  const isFr = lang === 'fr'
  const [dict, dbParties] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveSunsetParties(),
  ])
  const p = {
    ...dict.sunset_parties_page,
    parties: dbParties.length > 0
      ? dbParties.map(p => ({
          id:       p.slug,
          slug:     p.slug as string | undefined,
          name:     isFr ? p.nameFr : p.nameEn,
          lede:     isFr ? p.ledeFr : p.ledeEn,
          capacity: p.capacity,
          season:   p.season,
        }))
      : dict.sunset_parties_page.parties.map((p: { id: string; name: string; lede: string; capacity: string; season: string }) => ({ ...p, slug: undefined as string | undefined })),
  }

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="sunset" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.5) 0%, rgba(20,12,8,0.35) 55%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      {/* Parties */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(64px,9vw,120px)' }}>
          {p.parties.map((party, i) => (
            <article
              key={party.id}
              id={party.id}
              style={{
                scrollMarginTop: 'var(--nav-h)',
                display: 'grid',
                gridTemplateColumns: i % 2 === 0 ? '1fr 1.1fr' : '1.1fr 1fr',
                gap: 'clamp(32px,5vw,80px)',
                alignItems: 'center',
              }}
              className="table-article"
            >
              {i % 2 === 0 ? (
                <>
                  <PartyText party={party} p={p} lang={lang} index={i} />
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                    <Photo kind={kindMap[i % 3]} alt={party.name} style={{ position: 'absolute', inset: 0 }} />
                    <div aria-hidden="true" style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--paper)', opacity: 0.85, zIndex: 4 }}>0{i + 1}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                    <Photo kind={kindMap[i % 3]} alt={party.name} style={{ position: 'absolute', inset: 0 }} />
                    <div aria-hidden="true" style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--paper)', opacity: 0.85, zIndex: 4 }}>0{i + 1}</div>
                  </div>
                  <PartyText party={party} p={p} lang={lang} index={i} />
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Photo break */}
      <section style={{ position: 'relative', height: 'clamp(300px,40vw,540px)', overflow: 'hidden' }}>
        <Photo kind="aperitif" alt="Sunset over the Agafay desert at golden hour" style={{ position: 'absolute', inset: 0 }} grain={false} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,8,0.38)' }} />
        <GrainOverlay opacity={0.3} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--gutter)' }}>
          <blockquote style={{ margin: 0, textAlign: 'center', maxWidth: 680 }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3.5vw,44px)', lineHeight: 1.12, letterSpacing: '-0.015em', color: 'var(--paper)', margin: 0 }}>
              {lang === 'fr'
                ? 'Le désert n\'a pas besoin de mise en scène. Il suffit d\'attendre six heures du soir.'
                : 'The desert needs no staging. You only have to wait until six o\'clock.'}
            </p>
          </blockquote>
        </div>
      </section>

      {/* Enquire CTA */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {p.enquire_cta}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.55)', margin: '0 0 40px', textTransform: 'uppercase' }}>
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

function PartyText({
  party,
  p,
  lang,
  index,
}: {
  party: { id: string; slug?: string; name: string; lede: string; capacity: string; season: string }
  p: { enquire_cta: string }
  lang: string
  index: number
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 18 }}>
        № 0{index + 1}
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
        {party.slug ? (
          <Link href={`/${lang}/sunset-parties/${party.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {party.name}
          </Link>
        ) : party.name}
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0', lineHeight: 1.45 }}>
        {party.lede}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
        {[
          [lang === 'fr' ? 'Capacité' : 'Capacity', party.capacity],
          [lang === 'fr' ? 'Saison' : 'Season',    party.season],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {party.slug && (
          <Link href={`/${lang}/sunset-parties/${party.slug}`} className="cta">
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
  )
}
