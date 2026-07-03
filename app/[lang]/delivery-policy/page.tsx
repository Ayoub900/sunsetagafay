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
      ? "Politique d'Exécution des Services — Sunset Agafay"
      : 'Service Delivery Policy — Sunset Agafay',
    description: isFr
      ? 'Modalités de confirmation et de fourniture des prestations réservées — Sunset Agafay.'
      : 'How booked services are confirmed and delivered — Sunset Agafay.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/delivery-policy'),
  }
}

export default async function DeliveryPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  const items: { label: string; text: string }[] = isFr
    ? [
        { label: 'Nature des prestations', text: 'Sunset Agafay propose des prestations de services : hébergement, restauration, Day Pass, Night Pass, événements, transferts et activités. Aucun bien physique n’est expédié.' },
        { label: 'Confirmation', text: "Après paiement, une confirmation est envoyée par e-mail ou par WhatsApp, récapitulant la prestation réservée." },
        { label: 'Exécution', text: "Les prestations sont fournies à la date et à l'horaire réservés, sur le site de Sunset Agafay ou selon les modalités convenues (par exemple le lieu de prise en charge pour les transferts)." },
        { label: 'Transferts', text: 'Le transport est disponible sur réservation ; les détails de prise en charge sont confirmés avant la date de la prestation.' },
        { label: 'Délais', text: "La confirmation est transmise dans les meilleurs délais après réception du paiement ou de l'acompte demandé." },
        { label: 'Assistance', text: `Pour toute question relative à votre réservation : ${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
      ]
    : [
        { label: 'Nature of services', text: 'Sunset Agafay provides services: accommodation, dining, Day Pass, Night Pass, events, transfers and activities. No physical goods are shipped.' },
        { label: 'Confirmation', text: 'After payment, a confirmation summarising the booked service is sent by e-mail or WhatsApp.' },
        { label: 'Delivery', text: 'Services are provided on the date and time booked, at the Sunset Agafay site or as otherwise agreed (for example the pick-up location for transfers).' },
        { label: 'Transfers', text: 'Transport is available on request; pick-up details are confirmed before the date of the service.' },
        { label: 'Timing', text: 'Confirmation is sent as soon as possible after receipt of the payment or the requested deposit.' },
        { label: 'Support', text: `For any question about your reservation: ${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
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
            {isFr ? "Politique d'Exécution des Services" : 'Service Delivery Policy'}
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
