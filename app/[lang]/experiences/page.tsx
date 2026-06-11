import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'
import { Photo, GrainOverlay } from '@/components/shared'
import { getActiveExperiences, getActiveTreatments } from '@/lib/db'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.experiences_title,
    description: dict.meta.experiences_description,
    keywords: dict.meta.experiences_keywords,
    alternates: buildAlternates(lang, '/experiences'),
    openGraph: {
      title: dict.meta.experiences_title,
      description: dict.meta.experiences_description,
      url: `https://sunsetagafay.com/${lang}/experiences`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function ExperiencesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'
  const [dict, dbExperiences, dbTreatments] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveExperiences(),
    getActiveTreatments(),
  ])
  const p = dict.experiences_page
  const es = dict.experiences_section
  const experiences = dbExperiences.length > 0
    ? dbExperiences.map(e => ({
        n:    e.n,
        name: isFr ? e.nameFr : e.nameEn,
        when: e.when,
        who:  e.who,
        lede: isFr ? e.ledeFr : e.ledeEn,
      }))
    : dict.experiences
  const hammam = dbTreatments.length > 0
    ? {
        ...dict.hammam_section,
        treatments: dbTreatments.map(t => ({
          name: isFr ? t.nameFr : t.nameEn,
          duration: t.duration,
          price: t.price,
        })),
      }
    : dict.hammam_section

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section className="page-hero">
        <Photo kind="sunset" src="/couple-cocktails.webp" alt="" style={{ position: 'absolute', inset: 0 }} grain={false} priority />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(20,12,8,0.5) 0%, rgba(20,12,8,0.38) 60%, rgba(20,12,8,0.8) 100%)' }} />
        <GrainOverlay opacity={0.4} blend="overlay" style={{ zIndex: 3 }} />
        <div className="page-hero-content" style={{ zIndex: 4 }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 24 }}>{p.hero_eyebrow}</div>
          <h1 className="page-hero-title">{p.hero_title}</h1>
          <p className="page-hero-sub">{p.hero_sub}</p>
        </div>
      </section>

      {/* Experiences list */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ marginBottom: 'clamp(48px,6vw,72px)' }}>
            <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 20 }}>{es.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
              {isFr ? 'Nos expériences' : 'Our experiences'}
            </h2>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0', maxWidth: 600 }}>
              {es.lede}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: 'clamp(24px,4vw,48px)' }}>
            {experiences.map(exp => (
              <article
                key={exp.n}
                style={{
                  padding: 'clamp(28px,3.5vw,44px)',
                  border: '1px solid rgba(31,26,20,0.14)',
                  background: 'var(--paper-deep)',
                  position: 'relative',
                }}
              >
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--sienna)', marginBottom: 18 }}>
                  № {exp.n}
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(22px,2.8vw,32px)', lineHeight: 1.05, letterSpacing: '-0.012em', margin: 0, color: 'var(--ink)' }}>
                  {exp.name}
                </h2>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 'clamp(12px,1.5vw,18px) 0 0' }}>
                  {exp.lede}
                </p>
                <div style={{ marginTop: 'clamp(20px,2.5vw,28px)', paddingTop: 'clamp(16px,2vw,22px)', borderTop: '1px solid rgba(31,26,20,0.14)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
                      {lang === 'fr' ? 'Horaire' : 'When'}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)' }}>{exp.when}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
                      {lang === 'fr' ? 'Invités' : 'For'}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)' }}>{exp.who}</div>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <Link href={`/${lang}/contact`} className="cta">
                    <span className="cta-label">{p.book_cta}</span>
                    <span className="cta-arrow" aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hammam section */}
      <section style={{ background: 'var(--paper-deep)', padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <GrainOverlay opacity={0.1} blend="multiply" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div className="hammam-grid">
            <div>
              <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 'clamp(20px,2.5vw,28px)' }}>
                {hammam.eyebrow}
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
                {hammam.title_1}<br />
                <span style={{ fontFamily: 'var(--script)', fontStyle: 'italic', fontSize: '1.2em', lineHeight: 0.7, color: 'var(--brass)' }}>
                  {hammam.title_script}
                </span>
              </h2>
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(17px,2vw,20px)', lineHeight: 1.5, color: 'var(--sienna)', margin: 'clamp(20px,3vw,28px) 0 0', maxWidth: 560 }}>
                {hammam.lede}
              </p>
              <ul
                style={{ listStyle: 'none', margin: 'clamp(28px,4vw,44px) 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(12px,2vw,18px) clamp(24px,4vw,56px)', maxWidth: 640 }}
                role="list"
              >
                {hammam.treatments.map(t => (
                  <li key={t.name} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(31,26,20,0.18)' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(15px,1.6vw,17px)', color: 'var(--ink)' }}>{t.name}</span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-soft)', whiteSpace: 'nowrap', paddingLeft: 8 }}>
                      {t.duration} · {t.price}
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'clamp(28px,4vw,44px)' }}>
                <Link href={`/${lang}/contact`} className="cta">
                  <span className="cta-label">{hammam.cta}</span>
                  <span className="cta-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="hammam-frame frame-double" style={{ width: '100%', aspectRatio: '3 / 5', position: 'relative', overflow: 'hidden' }}>
              <img
                src="/suite-tent-interior.webp"
                alt="Tented suite interior at Sunset Agafay"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
                loading="lazy"
              />
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to top, rgba(20,12,8,0.55), transparent 45%)' }} />
              <div aria-hidden="true" style={{ position: 'absolute', left: 18, bottom: 14, color: 'var(--paper)', fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.18em', opacity: 0.85, zIndex: 4 }}>
                PLATE V · STEAM ROOM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inquire CTA */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(64px,9vw,100px) var(--gutter)', textAlign: 'center' }}>
        <GrainOverlay opacity={0.16} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.97, letterSpacing: '-0.018em', margin: '0 0 40px' }}>
            {lang === 'fr' ? 'Réservez votre expérience.' : 'Book your experience.'}
          </h2>
          <Link href={`/${lang}/contact`} className="cta">
            <span className="cta-label">{p.inquire_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
