import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale } from '../dictionaries'
import { buildAlternates } from '@/lib/seo'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WEB } from '@/lib/contact'
import {
  COMPANY_NAME, LEGAL_FORM, RC, ICE, CAPITAL, REGISTRATION_DATE, HQ_ADDRESS,
  MANAGER, IF, PATENTE, TRIBUNAL,
} from '@/lib/legal'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const isFr = lang === 'fr'
  return {
    title: isFr ? 'Mentions Légales — Sunset Agafay' : 'Legal Notice — Sunset Agafay',
    description: isFr
      ? 'Mentions légales et informations sur la société Sunset Agafay SARL.'
      : 'Legal notice and company information for Sunset Agafay SARL.',
    robots: { index: false, follow: true },
    alternates: buildAlternates(lang, '/legal-notice'),
  }
}

export default async function LegalNoticePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  // Only render rows whose value is known — empty values stay hidden.
  const rows: { label: string; value: string }[] = [
    { label: isFr ? 'Dénomination sociale' : 'Company name', value: COMPANY_NAME },
    { label: isFr ? 'Forme juridique' : 'Legal form', value: LEGAL_FORM },
    { label: isFr ? 'Gérant' : 'Manager', value: MANAGER },
    { label: isFr ? 'Capital social' : 'Share capital', value: CAPITAL },
    { label: isFr ? "Registre du Commerce (RC)" : 'Trade register (RC)', value: RC },
    { label: isFr ? "Tribunal d'immatriculation" : 'Registration court', value: TRIBUNAL },
    { label: 'ICE', value: ICE },
    { label: isFr ? 'Identifiant Fiscal (IF)' : 'Tax ID (IF)', value: IF },
    { label: isFr ? 'Taxe Professionnelle (Patente)' : 'Professional tax (Patente)', value: PATENTE },
    { label: isFr ? "Date d'immatriculation" : 'Registration date', value: REGISTRATION_DATE },
    { label: isFr ? 'Siège social' : 'Registered office', value: HQ_ADDRESS },
    { label: isFr ? 'Téléphone' : 'Phone', value: CONTACT_PHONE },
    { label: 'Email', value: CONTACT_EMAIL },
    { label: isFr ? 'Site web' : 'Website', value: CONTACT_WEB },
  ].filter((r) => r.value && r.value.length > 0)

  const hosting = isFr
    ? "Le site est hébergé par un prestataire tiers. Le traitement des paiements en ligne par carte bancaire est assuré de manière sécurisée par le Centre Monétique Interbancaire (CMI)."
    : 'The website is hosted by a third-party provider. Online card payments are processed securely by the Centre Monétique Interbancaire (CMI).'

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
            {isFr ? 'Mentions Légales' : 'Legal Notice'}
            <span style={{ display: 'block', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: 'clamp(13px,1.4vw,15px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 16 }}>
              <span translate="no" className="notranslate">Sunset Agafay SARL</span>
            </span>
          </h1>
          <dl style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, color: 'var(--ink-soft)', margin: 0 }}>
            {rows.map((row) => (
              <div key={row.label} style={{ marginBottom: 'clamp(18px,2vw,24px)' }}>
                <dt style={{ fontWeight: 600, color: 'var(--ink)' }}>{row.label}</dt>
                <dd style={{ margin: '4px 0 0' }}>
                  <span translate="no" className="notranslate">{row.value}</span>
                </dd>
              </div>
            ))}
            <div style={{ marginBottom: 'clamp(18px,2vw,24px)' }}>
              <dt style={{ fontWeight: 600, color: 'var(--ink)' }}>{isFr ? 'Hébergement et paiement' : 'Hosting and payment'}</dt>
              <dd style={{ margin: '4px 0 0' }}>{hosting}</dd>
            </div>
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
