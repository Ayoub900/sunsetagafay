import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale } from '../dictionaries'
import { buildAlternates } from '@/lib/seo'
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/contact'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const isFr = lang === 'fr'
  return {
    title: isFr
      ? "Politique d'Annulation et de Remboursement — Sunset Agafay"
      : 'Cancellation & Refund Policy — Sunset Agafay',
    description: isFr
      ? "Conditions d'annulation, de modification et de remboursement des réservations — Sunset Agafay."
      : 'Cancellation, modification and refund conditions for reservations — Sunset Agafay.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/refund-policy'),
  }
}

export default async function RefundPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  const items: { label: string; text: string }[] = isFr
    ? [
        { label: 'Principe général', text: "Les conditions d'annulation dépendent de la prestation réservée et des conditions communiquées lors de la réservation. Tous les tarifs sont exprimés en dirhams marocains (MAD)." },
        { label: 'Hébergement', text: "Les annulations d'hébergement sont gratuites jusqu'à 7 jours avant l'arrivée. Dans les 7 jours précédant l'arrivée, la première nuit est facturée et n'est pas remboursable." },
        { label: 'Day Pass, Night Pass, activités et événements', text: "Un acompte de 50 % est demandé à la réservation et reste non remboursable en cas d'annulation." },
        { label: 'Modification', text: "Toute demande de modification est possible selon les disponibilités et les conditions applicables à la prestation." },
        { label: 'Remboursement', text: "Lorsqu'un remboursement est dû, il est effectué sur le moyen de paiement utilisé lors de la réservation, dans un délai raisonnable après validation." },
        { label: 'Force majeure', text: "En cas de force majeure, un report ou un remboursement pourra être proposé." },
        { label: 'Contact', text: `Pour toute demande d'annulation ou de remboursement : ${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
      ]
    : [
        { label: 'General principle', text: 'Cancellation conditions depend on the service booked and the terms communicated at the time of booking. All prices are quoted in Moroccan dirhams (MAD).' },
        { label: 'Accommodation', text: 'Accommodation cancellations are free up to 7 days before arrival. Within the 7 days preceding arrival, the first night is charged and is non-refundable.' },
        { label: 'Day Pass, Night Pass, activities and events', text: 'A 50% deposit is required at booking and remains non-refundable in the event of cancellation.' },
        { label: 'Modification', text: 'Any modification request is possible subject to availability and the conditions applicable to the service.' },
        { label: 'Refund', text: 'When a refund is due, it is issued to the payment method used for the booking, within a reasonable time after validation.' },
        { label: 'Force majeure', text: 'In the event of force majeure, a postponement or a refund may be offered.' },
        { label: 'Contact', text: `For any cancellation or refund request: ${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
      ]

  return (
    <div data-solid-nav style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{
        paddingTop: 'calc(var(--nav-h) + clamp(48px,6vw,80px))',
        paddingBottom: 'clamp(64px,9vw,120px)',
        paddingLeft: 'var(--gutter)',
        paddingRight: 'var(--gutter)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1.05, letterSpacing: '-0.018em', margin: '0 0 clamp(32px,4vw,48px)', color: 'var(--ink)' }}>
            {isFr ? "Politique d'Annulation et de Remboursement" : 'Cancellation & Refund Policy'}
            <span style={{ display: 'block', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: 'clamp(13px,1.4vw,15px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 16 }}>
              <span translate="no" className="notranslate">Sunset Agafay Resort</span>
            </span>
          </h1>
          <dl style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}>
            {items.map((item) => (
              <div key={item.label} style={{ marginBottom: 'clamp(18px,2vw,24px)' }}>
                <dt style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.label}</dt>
                <dd style={{ margin: '4px 0 0' }}>{item.text}</dd>
              </div>
            ))}
          </dl>
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
