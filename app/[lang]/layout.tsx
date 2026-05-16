import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NavServer } from '@/components/NavServer'
import { Footer } from '@/components/Footer'
import { getDictionary, hasLocale, type Locale } from './dictionaries'
import { buildAlternates } from '@/lib/seo'

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'fr' }]
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: { template: '%s | Sunset Agafay', default: dict.meta.home_title },
    description: dict.meta.home_description,
    keywords: dict.meta.home_keywords,
    openGraph: {
      siteName:    'Sunset Agafay',
      locale:      lang === 'fr' ? 'fr_FR' : 'en_US',
      type:        'website',
      images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'Sunset Agafay — Boutique Kasbah' }],
    },
    twitter: { card: 'summary_large_image', site: '@sunsetagafay', creator: '@sunsetagafay' },
    alternates: buildAlternates(lang, ''),
  }
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Sunset Agafay',
  description: 'A boutique kasbah of fourteen rooms in the Agafay desert, one hour from Marrakech.',
  url: 'https://sunsetagafay.com',
  logo: 'https://sunsetagafay.com/logo_gold.webp',
  image: 'https://sunsetagafay.com/og/home.jpg',
  priceRange: '€€€€',
  numberOfRooms: 14,
  telephone: '+212524000000',
  email: 'bonjour@sunsetagafay.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: "Route d'Amizmiz, KM 47",
    addressLocality: 'Agafay',
    addressRegion: 'Marrakech-Safi',
    postalCode: '42150',
    addressCountry: 'MA',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 31.3667, longitude: -8.1667 },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Pool',         value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurant',   value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Bar',          value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Hammam',       value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free Parking', value: true },
  ],
  starRating: { '@type': 'Rating', ratingValue: 5 },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Sunset Agafay',
  url: 'https://sunsetagafay.com',
  inLanguage: ['en', 'fr'],
  publisher: {
    '@type': 'Organization',
    name: 'Sunset Agafay',
    logo: { '@type': 'ImageObject', url: 'https://sunsetagafay.com/logo_gold.webp' },
  },
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <NavServer dict={dict.nav} lang={lang as 'en' | 'fr'} />
      <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer dict={dict.footer} lang={lang} />
    </>
  )
}
