import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NavServer } from '@/components/NavServer'
import { Footer } from '@/components/Footer'
import { getDictionary, hasLocale, type Locale } from './dictionaries'
import { buildAlternates } from '@/lib/seo'
import { CONTACT_PHONE, CONTACT_EMAIL } from '@/lib/contact'

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
    },
    twitter: { card: 'summary_large_image', site: '@sunsetagafay', creator: '@sunsetagafay' },
    alternates: buildAlternates(lang, ''),
  }
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  '@id': 'https://sunsetagafay.com/#lodging',
  name: 'Sunset Agafay',
  description: 'A boutique kasbah of fourteen rooms in the Agafay desert, one hour from Marrakech.',
  url: 'https://sunsetagafay.com',
  logo: 'https://sunsetagafay.com/logo_gold.webp',
  image: 'https://sunsetagafay.com/opengraph-image',
  priceRange: '€€€€',
  numberOfRooms: 14,
  ...(CONTACT_PHONE ? { telephone: CONTACT_PHONE } : {}),
  ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
  checkinTime: '15:00',
  checkoutTime: '11:00',
  currenciesAccepted: 'EUR, MAD, USD',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  petsAllowed: false,
  smokingAllowed: false,
  address: {
    '@type': 'PostalAddress',
    streetAddress: "Route d'Amizmiz, KM 47",
    addressLocality: 'Agafay',
    addressRegion: 'Marrakech-Safi',
    postalCode: '42150',
    addressCountry: 'MA',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 31.3667, longitude: -8.1667 },
  hasMap: 'https://www.google.com/maps?q=31.3667,-8.1667',
  containedInPlace: {
    '@type': 'Place',
    name: 'Agafay Desert',
    sameAs: 'https://en.wikipedia.org/wiki/Agafay_Desert',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Swimming Pool', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurant',    value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Bar',           value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Hammam',        value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free Parking',  value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free Wi-Fi',    value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Airport Shuttle', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Garden',        value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Library',       value: true },
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
