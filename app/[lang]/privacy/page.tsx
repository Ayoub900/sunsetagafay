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
    title: isFr ? 'Politique de Confidentialité — Sunset Agafay' : 'Privacy Policy — Sunset Agafay',
    description: isFr
      ? 'Politique de confidentialité de Sunset Agafay Resort.'
      : 'Privacy policy of Sunset Agafay Resort.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/privacy'),
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  const items: { label: string; text: string }[] = isFr
    ? [
        { label: 'Collecte des informations', text: 'nom, email, téléphone, réservations et données de navigation.' },
        { label: 'Utilisation des données', text: 'gestion des réservations, assistance client et amélioration des services.' },
        { label: 'Protection des données', text: 'mesures de sécurité adaptées.' },
        { label: 'Partage des informations', text: 'uniquement avec les partenaires nécessaires ou les autorités compétentes lorsque requis.' },
        { label: 'Cookies', text: "utilisés pour améliorer l'expérience utilisateur." },
        { label: 'Conservation des données', text: 'pendant la durée nécessaire aux finalités prévues.' },
        { label: 'Vos droits', text: 'accès, rectification, suppression et opposition.' },
        { label: 'Contact', text: `${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
      ]
    : [
        { label: 'Information collected', text: 'name, email, phone, reservations and browsing data.' },
        { label: 'Use of data', text: 'managing reservations, customer assistance and improving our services.' },
        { label: 'Data protection', text: 'appropriate security measures.' },
        { label: 'Sharing of information', text: 'only with necessary partners or the competent authorities when required.' },
        { label: 'Cookies', text: 'used to improve the user experience.' },
        { label: 'Data retention', text: 'for as long as necessary for the intended purposes.' },
        { label: 'Your rights', text: 'access, rectification, deletion and objection.' },
        { label: 'Contact', text: `${CONTACT_EMAIL} | ${CONTACT_PHONE}.` },
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
            {isFr ? 'Politique de Confidentialité' : 'Privacy Policy'}
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
