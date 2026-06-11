import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveRestaurants } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.restaurants_title,
    description: dict.meta.restaurants_description,
    keywords: dict.meta.restaurants_keywords,
    alternates: buildAlternates(lang, '/restaurants'),
    openGraph: {
      title: dict.meta.restaurants_title,
      description: dict.meta.restaurants_description,
      url: `https://sunsetagafay.com/${lang}/restaurants`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

const kindMap = ['palms', 'aperitif', 'courtyard', 'sunset'] as const

type TableRow = { slug?: string; name: string; lede: string; hours: string; imageUrl?: string }

export default async function RestaurantsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbRestaurants] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveRestaurants(),
  ])
  const p = dict.restaurants_page
  const tables: TableRow[] = dbRestaurants.length > 0
    ? dbRestaurants.map(r => ({
        slug:  r.slug,
        name:  isFr ? r.nameFr : r.nameEn,
        lede:  isFr ? r.ledeFr : r.ledeEn,
        hours: r.hours,
        imageUrl: r.imageUrl,
      }))
    : dict.tables.map((t: { name: string; lede: string; copy: string; hours: string }) => ({ ...t }))
  const ts = dict.tables_section

  return (
    <div style={{ background: 'var(--paper)' }}>
      <section className="page-hero">
        <Photo kind="aperitif" src="/dining-tent-night.webp" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.4) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(80px,10vw,140px)' }}>
          {tables.map((t, i) => (
            <article
              key={t.slug ?? t.name}
              id={t.slug}
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
                  <TableText t={t} ts={ts} p={p} lang={lang} />
                  <TablePhoto t={t} i={i} />
                </>
              ) : (
                <>
                  <TablePhoto t={t} i={i} />
                  <TableText t={t} ts={ts} p={p} lang={lang} />
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 12px' }}>
            {p.reserve_cta}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(242,232,213,0.55)', margin: '0 0 40px', textTransform: 'uppercase' }}>
            {p.reserve_cta_sub}
          </p>
          <Link href={`/${lang}/contact`} className="cta">
            <span className="cta-label">{p.reserve_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function TablePhoto({ t, i }: { t: TableRow; i: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
      <Photo kind={kindMap[i % kindMap.length]} src={t.imageUrl || undefined} alt={t.name} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}

function TableText({ t, ts, p, lang }: {
  t: TableRow
  ts: { service: string }
  p: { reserve_cta: string }
  lang: string
}) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
        {t.name}
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0', lineHeight: 1.45 }}>
        {t.lede}
      </p>
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(31,26,20,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{ts.service}</span>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(15px,1.7vw,18px)', color: 'var(--ink)' }}>{t.hours}</span>
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {t.slug && (
          <Link href={`/${lang}/restaurants/${t.slug}`} className="cta">
            <span className="cta-label">{lang === 'fr' ? 'Découvrir' : 'Discover'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        )}
        <Link href={`/${lang}/contact`} className="cta">
          <span className="cta-label">{p.reserve_cta}</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
