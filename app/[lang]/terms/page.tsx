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
    title: isFr ? "Conditions Générales — Sunset Agafay" : 'Terms & Conditions — Sunset Agafay',
    description: isFr
      ? "Conditions générales d'utilisation et de vente — Sunset Agafay Resort."
      : 'Terms and conditions of use and sale — Sunset Agafay Resort.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/terms'),
  }
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  const items: { label: string; text: string }[] = isFr
    ? [
        { label: 'Présentation', text: "Le site permet la réservation d'expériences, d'activités, de restauration, d'hébergement et d'événements." },
        { label: 'Réservations', text: 'Toute réservation est soumise à disponibilité et confirmée par écrit.' },
        { label: 'Paiement', text: 'Un acompte peut être demandé selon la prestation réservée.' },
        { label: 'Annulation et modification', text: "Les annulations d'hébergement sont gratuites jusqu'à 7 jours avant l'arrivée. Dans les 7 jours précédant l'arrivée, la première nuit est facturée et non remboursable. Pour les Day Pass, Night Pass, activités et événements, un acompte de 50 % est demandé et reste non remboursable en cas d'annulation." },
        { label: 'Hébergement', text: 'Check-in 15h00, Check-out 12h00.' },
        { label: 'Activités', text: 'Les participants doivent respecter les consignes de sécurité.' },
        { label: 'Responsabilité', text: 'Sunset Agafay Resort ne peut être tenu responsable des cas de force majeure ou pertes d\'objets personnels.' },
        { label: 'Comportement des visiteurs', text: "Tout comportement inapproprié peut entraîner l'annulation de la prestation sans remboursement." },
        { label: 'Propriété intellectuelle', text: 'Les contenus du site sont protégés.' },
        { label: 'Droit applicable', text: 'Droit marocain.' },
        { label: 'Contact', text: `${CONTACT_PHONE} | ${CONTACT_EMAIL}.` },
      ]
    : [
        { label: 'Overview', text: 'The site allows the booking of experiences, activities, dining, accommodation and events.' },
        { label: 'Reservations', text: 'Any reservation is subject to availability and confirmed in writing.' },
        { label: 'Payment', text: 'A deposit may be requested depending on the service booked.' },
        { label: 'Cancellation and modification', text: 'Accommodation cancellations are free up to 7 days before arrival. Within the 7 days preceding arrival, the first night is charged and non-refundable. For Day Pass, Night Pass, activities and events, a 50% deposit is required and remains non-refundable in the event of cancellation.' },
        { label: 'Accommodation', text: 'Check-in 3:00 PM, Check-out 12:00 PM.' },
        { label: 'Activities', text: 'Participants must follow the safety instructions.' },
        { label: 'Liability', text: 'Sunset Agafay Resort cannot be held responsible for cases of force majeure or loss of personal belongings.' },
        { label: 'Visitor conduct', text: 'Any inappropriate behaviour may result in the cancellation of the service without refund.' },
        { label: 'Intellectual property', text: 'The contents of the site are protected.' },
        { label: 'Governing law', text: 'Moroccan law.' },
        { label: 'Contact', text: `${CONTACT_PHONE} | ${CONTACT_EMAIL}.` },
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
            {isFr ? "Conditions Générales d'Utilisation et de Vente" : 'Terms & Conditions of Use and Sale'}
            <span style={{ display: 'block', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: 'clamp(13px,1.4vw,15px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 16 }}>
              {isFr ? 'CGU/CGV — ' : ''}<span translate="no" className="notranslate">Sunset Agafay Resort</span>
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
