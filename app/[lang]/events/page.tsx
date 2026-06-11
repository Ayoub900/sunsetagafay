import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveEvents } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'
import EventRequestForm from '@/components/EventRequestForm'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.events_title,
    description: dict.meta.events_description,
    keywords: dict.meta.events_keywords,
    alternates: buildAlternates(lang, '/events'),
    openGraph: {
      title: dict.meta.events_title,
      description: dict.meta.events_description,
      url: `https://sunsetagafay.com/${lang}/events`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function EventsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbEvents] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveEvents(),
  ])
  const p = dict.events_page
  const eventTypes = dbEvents.length > 0
    ? dbEvents.map(e => ({
        slug:     e.slug,
        name:     isFr ? e.nameFr : e.nameEn,
        lede:     isFr ? e.ledeFr : e.ledeEn,
        capacity: e.capacity,
      }))
    : dict.events_section.types.map((t: { name: string; lede: string; capacity: string }) => ({ ...t, slug: undefined as string | undefined }))
  const es = { ...dict.events_section, types: eventTypes }

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="courtyard" src="/event-pool-tables.webp" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.6) 0%, rgba(20,12,8,0.45) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      {/* Event types */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ marginBottom: 'clamp(48px,6vw,72px)', maxWidth: 640 }}>
            <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 20 }}>{es.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
              {es.title}
            </h2>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0' }}>
              {es.lede}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px,0.3vw,4px)' }}>
            {es.types.map((type, i) => (
              <article
                key={type.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  gap: 'clamp(24px,4vw,64px)',
                  padding: 'clamp(28px,3.5vw,44px) 0',
                  borderTop: '1px solid rgba(31,26,20,0.14)',
                }}
                className="event-row"
              >
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 14 }}>
                    0{i + 1}
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(26px,3.5vw,44px)', lineHeight: 1.02, letterSpacing: '-0.015em', margin: 0, color: 'var(--ink)' }}>
                    {type.slug ? (
                      <Link href={`/${lang}/events/${type.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {type.name}
                      </Link>
                    ) : type.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(12px,1.5vw,18px) 0 0', maxWidth: 600, lineHeight: 1.45 }}>
                    {type.lede}
                  </p>
                  {type.slug && (
                    <div style={{ marginTop: 20 }}>
                      <Link href={`/${lang}/events/${type.slug}`} className="cta">
                        <span className="cta-label">{lang === 'fr' ? 'Découvrir' : 'Discover'}</span>
                        <span className="cta-arrow" aria-hidden="true">→</span>
                      </Link>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 'clamp(28px,3vw,38px)' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
                    {lang === 'fr' ? 'Capacité' : 'Capacity'}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--ink)' }}>
                    {type.capacity}
                  </div>
                </div>
              </article>
            ))}
            <div style={{ borderTop: '1px solid rgba(31,26,20,0.14)' }} />
          </div>

        </div>
      </section>

      {/* Photo break */}
      <section style={{ position: 'relative', height: 'clamp(300px,40vw,540px)', overflow: 'hidden' }}>
        <Photo kind="palms" src="/proposal-sunset.webp" alt="Kasbah courtyard at sunset, Agafay desert" style={{ position: 'absolute', inset: 0 }} grain={false} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,8,0.32)' }} />
        <GrainOverlay opacity={0.3} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--gutter)' }}>
          <blockquote style={{ margin: 0, textAlign: 'center', maxWidth: 740 }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3.5vw,44px)', lineHeight: 1.12, letterSpacing: '-0.015em', color: 'var(--paper)', margin: 0 }}>
              {lang === 'fr'
                ? 'Le cadre ne nécessite aucune décoration supplémentaire.'
                : 'The setting needs no further decoration.'}
            </p>
          </blockquote>
        </div>
      </section>

      {/* Event request form */}
      <EventRequestForm
        labels={{
          eyebrow:    p.form_eyebrow,
          title:      p.form_title,
          lede:       p.form_lede,
          name:       p.form_name,
          email:      p.form_email,
          phone:      p.form_phone,
          event_type: p.form_event_type,
          event_date: p.form_event_date,
          guests:     p.form_guests,
          message:    p.form_message,
          submit:     p.form_submit,
          sending:    p.form_sending,
          submitted:  p.form_submitted,
          error_generic: isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'Something went wrong. Please try again.',
          event_type_options: eventTypes.map(t => t.name),
        }}
      />
    </div>
  )
}
