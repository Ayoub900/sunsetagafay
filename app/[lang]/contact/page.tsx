import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { buildAlternates } from '@/lib/seo'
import { CONTACT_PHONE, CONTACT_EMAIL } from '@/lib/contact'
import ContactForm from '@/components/ContactForm'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.contact_title,
    description: dict.meta.contact_description,
    keywords: dict.meta.contact_keywords,
    alternates: buildAlternates(lang, '/contact'),
    openGraph: {
      title: dict.meta.contact_title,
      description: dict.meta.contact_description,
      url: `https://sunsetagafay.com/${lang}/contact`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const { table } = await searchParams
  const dict = await getDictionary(lang as Locale)
  const c = dict.contact
  const isFr = lang === 'fr'

  const labels = {
    eyebrow:             c.eyebrow,
    title:               c.title,
    lede:                c.lede,
    name_label:          c.name_label,
    email_label:         c.email_label,
    phone_label:         c.phone_label,
    subject_label:       c.subject_label,
    subject_reservation: c.subject_reservation,
    subject_table:       c.subject_table,
    subject_event:       c.subject_event,
    subject_concierge:   c.subject_concierge,
    subject_other:       c.subject_other,
    table_label:         c.table_label,
    requested_table:     (table ?? '').slice(0, 200),
    checkin_label:       c.checkin_label,
    checkout_label:      c.checkout_label,
    guests_label:        c.guests_label,
    message_label:       c.message_label,
    submit:              c.submit,
    sending:             isFr ? 'Envoi en cours…' : 'Sending…',
    submitted:           isFr ? 'Message envoyé. Nous vous répondrons dans les 24 heures.' : "Message sent. We'll be in touch within 24 hours.",
    error_generic:       isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'Something went wrong. Please try again.',
    direct_eyebrow:      c.direct_eyebrow,
    address_label:       c.address_label,
    directions_label:    c.directions_label,
    directions:          c.directions,
    address_lines:       c.address_lines,
    phone:               CONTACT_PHONE,
    email:               CONTACT_EMAIL,
    phone_label_direct:  isFr ? 'Téléphone' : 'Phone',
    email_label_direct:  isFr ? 'E-mail' : 'Email',
  }

  return <ContactForm labels={labels} />
}
