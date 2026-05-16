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
    title: isFr ? "Conditions Générales — Sunset Agafay" : 'Terms & Conditions — Sunset Agafay',
    description: isFr
      ? "Conditions générales d'utilisation et de réservation — Sunset Agafay."
      : 'Terms and conditions for reservations and use of Sunset Agafay services.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/terms'),
  }
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
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
            {isFr ? 'Conditions Générales' : 'Terms & Conditions'}
          </h1>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            <p>
              {isFr
                ? 'Les réservations à Sunset Agafay sont confirmées par notre équipe dans un délai de 24 heures. Un acompte peut être demandé pour garantir votre réservation. Les conditions d\'annulation sont communiquées au moment de la confirmation.'
                : 'Reservations at Sunset Agafay are confirmed by our team within 24 hours. A deposit may be requested to secure your booking. Cancellation conditions are communicated at the time of confirmation.'}
            </p>
            <p>
              {isFr
                ? 'Les tarifs sont indiqués en euros par nuit. Le petit-déjeuner est sur demande. Les prix peuvent varier selon la saison et la disponibilité.'
                : 'Rates are quoted in euros per night. Breakfast is available on request. Prices may vary by season and availability.'}
            </p>
            <p>
              {isFr
                ? 'Pour toute demande relative aux conditions de réservation ou aux services, veuillez nous contacter directement.'
                : 'For any questions regarding booking conditions or services, please contact us directly.'}
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
