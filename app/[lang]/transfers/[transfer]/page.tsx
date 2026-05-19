import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveTransfers, getTransferBySlug } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  const items = await getActiveTransfers()
  return items.map(t => ({ transfer: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; transfer: string }> }): Promise<Metadata> {
  const { lang, transfer } = await params
  if (!hasLocale(lang)) return {}
  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getTransferBySlug(transfer),
  ])
  if (!item) return {}
  const isFr = lang === 'fr'
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const plainLede = lede.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${name} — Sunset Agafay`,
    description: plainLede,
    keywords: dict.meta.transfers_keywords,
    alternates: buildAlternates(lang, `/transfers/${transfer}`),
    openGraph: {
      title: `${name} — Sunset Agafay`,
      description: plainLede,
      url: `https://sunsetagafay.com/${lang}/transfers/${transfer}`,
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

export default async function TransferDetailPage({ params }: { params: Promise<{ lang: string; transfer: string }> }) {
  const { lang, transfer } = await params
  if (!hasLocale(lang)) notFound()

  const [dict, item] = await Promise.all([
    getDictionary(lang as Locale),
    getTransferBySlug(transfer),
  ])
  if (!item || !item.active) notFound()

  const isFr = lang === 'fr'
  const p = dict.transfers_page
  const name = isFr ? item.nameFr : item.nameEn
  const lede = isFr ? item.ledeFr : item.ledeEn
  const copy = isFr ? item.copyFr : item.copyEn
  const coverImage = item.imageUrl || undefined

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `https://sunsetagafay.com/${lang}` },
      { '@type': 'ListItem', position: 2, name: isFr ? 'Transferts' : 'Transfers', item: `https://sunsetagafay.com/${lang}/transfers` },
      { '@type': 'ListItem', position: 3, name, item: `https://sunsetagafay.com/${lang}/transfers/${transfer}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--paper)' }}>
      <section className="page-hero">
        <Photo kind="palms" src={coverImage} alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.4) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>
            {isFr ? 'Transfert' : 'Transfer'}
          </div>
          <h1 className="page-hero-title">{name}</h1>
          <p className="page-hero-sub" dangerouslySetInnerHTML={{ __html: lede }} />
        </div>
      </section>

      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px,6vw,96px)', alignItems: 'start' }} className="table-article">
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 20 }}>
              {isFr ? 'Service' : 'Service'}
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
                [isFr ? 'Durée' : 'Duration', item.duration],
                [isFr ? 'Tarif' : 'Rate', item.price],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36 }}>
              <Link href={`/${lang}/contact`} className="cta">
                <span className="cta-label">{p.enquire_cta}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
              <Photo kind="palms" src={coverImage} alt={name} style={{ position: 'absolute', inset: 0 }} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--sienna)', color: 'var(--paper)', padding: 'clamp(48px,6vw,72px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.18} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.65)', margin: '0 0 20px' }}>
            {isFr ? 'Tous les transferts' : 'All Transfers'}
          </p>
          <Link href={`/${lang}/transfers`} className="cta">
            <span className="cta-label">{isFr ? 'Voir tous les transferts' : 'See all transfers'}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
