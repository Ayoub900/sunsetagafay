import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { GrainOverlay } from '@/components/shared'
import ReservationWizard from './ReservationWizard'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.reserve_title,
    description: dict.meta.reserve_description,
    keywords: dict.meta.reserve_keywords,
    alternates: buildAlternates(lang, '/reserve'),
    openGraph: {
      title: dict.meta.reserve_title,
      description: dict.meta.reserve_description,
      url: `https://sunsetagafay.com/${lang}/reserve`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
      images: [{ url: '/og/reserve.jpg', width: 1200, height: 630, alt: 'Reserve — Sunset Agafay' }],
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function ReservePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang as Locale)
  const r = dict.reserve

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        position: 'relative',
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: 'clamp(80px,10vw,120px) var(--gutter) clamp(48px,6vw,72px)',
        overflow: 'hidden',
      }}>
        <GrainOverlay opacity={0.14} blend="overlay" />
        {/* Subtle horizon gradient */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,123,92,0.18) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>
            {r.hero_eyebrow}
          </div>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 'clamp(40px,7vw,88px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            margin: '0 0 24px',
            color: 'var(--paper)',
          }}>
            {r.hero_title}
          </h1>
          <p style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(16px,1.8vw,21px)',
            color: 'rgba(242,232,213,0.75)',
            margin: 0,
            maxWidth: 560,
            lineHeight: 1.6,
          }}>
            {r.hero_sub}
          </p>
        </div>
      </section>

      {/* Wizard */}
      <ReservationWizard dict={r} lang={lang} />
    </div>
  )
}
