import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveSuites } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.suites_title,
    description: dict.meta.suites_description,
    keywords: dict.meta.suites_keywords,
    alternates: buildAlternates(lang, '/suites'),
    openGraph: {
      title: dict.meta.suites_title,
      description: dict.meta.suites_description,
      url: `https://sunsetagafay.com/${lang}/suites`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

const kindMap = ['palms', 'courtyard', 'sunset', 'aperitif'] as const
const anchorMap = ['suite-agafay', 'suite-khoutoubia', 'suite-sunset', 'family-suite']

export default async function SuitesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbSuites] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveSuites(),
  ])
  const p = dict.suites_page

  type Room = {
    slug: string
    name: string
    brief: string
    area: string
    view: string
    rate: string
    imageUrl: string
    images: string[]
    isHtml: boolean
  }

  const rooms: Room[] = dbSuites.length > 0
    ? dbSuites.map(s => ({
        slug:     s.slug,
        name:     isFr ? s.nameFr : s.nameEn,
        brief:    isFr ? s.briefFr : s.briefEn,
        area:     s.area,
        view:     s.view,
        rate:     s.rate,
        imageUrl: s.imageUrl ?? '',
        images:   (s as { images?: string[] }).images ?? [],
        isHtml:   true,
      }))
    : (dict.rooms as { name: string; brief: string; area: string; view: string; rate: string }[]).map(r => ({
        ...r,
        slug: r.name.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e'),
        imageUrl: '',
        images: [],
        isHtml: false,
      }))

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="sunset" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.6) 0%, rgba(20,12,8,0.45) 60%, rgba(20,12,8,0.75) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      {/* Amenities strip */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(48px,6vw,72px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(24px,4vw,48px)', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--rose)', whiteSpace: 'nowrap' }}>
              {p.amenities_label}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px,2vw,28px)', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.7)' }}>
              {p.amenities.map(a => (
                <li key={a} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--brass)', display: 'inline-block' }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(64px,9vw,120px)' }}>
          {rooms.map((r, i) => (
            <article key={r.name} id={anchorMap[i]} style={{ scrollMarginTop: 'var(--nav-h)' }}>
              <div className="suite-grid" style={{ gridTemplateColumns: i % 2 === 0 ? '1fr 1.1fr' : '1.1fr 1fr' }}>
                {i % 2 === 0 ? (
                  <>
                    <SuiteImage r={r} kind={kindMap[Math.min(i, kindMap.length - 1)]} />
                    <RoomText r={r} p={p} lang={lang} />
                  </>
                ) : (
                  <>
                    <RoomText r={r} p={p} lang={lang} />
                    <SuiteImage r={r} kind={kindMap[Math.min(i, kindMap.length - 1)]} />
                  </>
                )}
              </div>

              {/* Gallery strip — shown when suite has 2+ images */}
              {r.images.length > 1 && (
                <div style={{
                  marginTop: 'clamp(20px,3vw,36px)',
                  display: 'flex', gap: 8, overflowX: 'auto',
                  paddingBottom: 4,
                }}>
                  {r.images.slice(1).map((src, gi) => (
                    <div key={gi} style={{
                      flex: '0 0 auto',
                      width: 'clamp(120px,16vw,200px)',
                      aspectRatio: '4/3',
                      borderRadius: 4, overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <img
                        src={src} alt=""
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Reserve CTA */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 36px' }}>
            {lang === 'fr' ? 'Retenez votre chambre.' : 'Hold your room.'}
          </h2>
          <Link href={`/${lang}/contact`} className="cta">
            <span className="cta-label">{p.reserve_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function SuiteImage({ r, kind }: { r: { name: string; imageUrl: string }; kind: string }) {
  const src = r.imageUrl || undefined
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
      <Photo
        kind={kind as 'sunset' | 'palms' | 'pool' | 'courtyard' | 'aperitif'}
        src={src}
        alt={r.name}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  )
}

function RoomText({
  r, p, lang,
}: {
  r: { slug: string; name: string; brief: string; area: string; view: string; rate: string; isHtml: boolean }
  p: { from_night: string; view_label: string; area_label: string; reserve_cta: string }
  lang: string
}) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
        {r.name}
      </h2>

      {r.isHtml ? (
        <div
          style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,14.5px)', lineHeight: 1.75, color: 'var(--ink-soft)', margin: 'clamp(14px,2vw,22px) 0 0', maxWidth: 480 }}
          dangerouslySetInnerHTML={{ __html: r.brief }}
        />
      ) : (
        <p style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,14.5px)', lineHeight: 1.75, color: 'var(--ink-soft)', margin: 'clamp(14px,2vw,22px) 0 0', maxWidth: 480 }}>
          {r.brief}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(31,26,20,0.18)' }}>
        {([
          [p.area_label, r.area],
          [p.view_label, r.view],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(31,26,20,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{p.from_night}</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,2.5vw,26px)', color: 'var(--brass)' }}>{r.rate}</span>
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
        <Link href={`/${lang}/reserve`} className="cta">
          <span className="cta-label">{p.reserve_cta}</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href={`/${lang}/suites/${r.slug}`} className="cta">
          <span className="cta-label">{lang === 'fr' ? 'Découvrir' : 'Details'}</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
