import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale } from '../dictionaries'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const isFr = lang === 'fr'
  return {
    title: isFr ? 'Politique de Confidentialité — Sunset Agafay' : 'Privacy Policy — Sunset Agafay',
    description: isFr
      ? 'Politique de confidentialité de la kasbah Sunset Agafay.'
      : 'Privacy policy of Sunset Agafay kasbah.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/privacy'),
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{
        paddingTop: 'calc(var(--nav-h) + clamp(48px,6vw,80px))',
        paddingBottom: 'clamp(64px,9vw,120px)',
        paddingLeft: 'var(--gutter)',
        paddingRight: 'var(--gutter)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1, letterSpacing: '-0.018em', margin: '0 0 clamp(32px,4vw,48px)', color: 'var(--ink)' }}>
            {isFr ? 'Politique de Confidentialité' : 'Privacy Policy'}
          </h1>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            <p>
              {isFr
                ? 'Sunset Agafay respecte votre vie privée. Les données que vous nous transmettez (nom, adresse e-mail, numéro de téléphone) via notre formulaire de contact ou de réservation sont utilisées uniquement pour traiter votre demande et vous répondre.'
                : 'Sunset Agafay respects your privacy. Personal data submitted through our contact or reservation forms (name, email address, phone number) is used solely to process your enquiry and respond to you.'}
            </p>
            <p>
              {isFr
                ? 'Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Pour toute question relative à vos données personnelles, contactez-nous à bonjour@sunsetagafay.com.'
                : 'Your data is never sold or shared with third parties for commercial purposes. For any questions regarding your personal data, please contact us at bonjour@sunsetagafay.com.'}
            </p>
            <p>
              {isFr
                ? 'Ce site utilise des cookies fonctionnels essentiels au bon fonctionnement des formulaires. Aucun cookie de tracking tiers n\'est utilisé.'
                : 'This site uses functional cookies essential to form operations. No third-party tracking cookies are used.'}
            </p>
          </div>
          <div style={{ marginTop: 48 }}>
            <Link href={`/${lang}/contact`} className="cta">
              <span className="cta-label">{isFr ? 'Nous contacter' : 'Contact Us'}</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
