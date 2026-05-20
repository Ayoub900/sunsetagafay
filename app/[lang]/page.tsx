import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from './dictionaries'
import { buildAlternates } from '@/lib/seo'
import { HeroCourtyard }  from '@/components/sections/Hero'
import { Marquee }        from '@/components/sections/Marquee'
import { MaisonLetter }   from '@/components/sections/MaisonLetter'
import { Suites }         from '@/components/sections/Suites'
import { CinematicBreak } from '@/components/sections/CinematicBreak'
import { Tables }         from '@/components/sections/Tables'
import { Experiences }    from '@/components/sections/Experiences'
import { Hammam }         from '@/components/sections/Hammam'
import { Reviews }        from '@/components/sections/Reviews'
import { FAQ }            from '@/components/sections/FAQ'
import { Practical }      from '@/components/sections/Practical'
import { getActiveSuites, getActiveRestaurants, getActiveExperiences, getActiveTreatments } from '@/lib/db'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.home_title,
    description: dict.meta.home_description,
    keywords: dict.meta.home_keywords,
    alternates: buildAlternates(lang, ''),
    openGraph: {
      title: dict.meta.home_title,
      description: dict.meta.home_description,
      url: `https://sunsetagafay.com/${lang}`,
      siteName: 'Sunset Agafay',
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    other: {
      'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_US',
    },
  }
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const isFr = lang === 'fr'

  const [dict, dbSuites, dbRestaurants, dbExperiences, dbTreatments] = await Promise.all([
    getDictionary(lang as Locale),
    getActiveSuites(),
    getActiveRestaurants(),
    getActiveExperiences(),
    getActiveTreatments(),
  ])

  // Map DB data to component interfaces, fall back to dict if DB is empty
  const rooms = dbSuites.length > 0
    ? dbSuites.map(s => ({
        slug:      s.slug,
        name:      isFr ? s.nameFr : s.nameEn,
        brief:     isFr ? s.briefFr : s.briefEn,
        area:      s.area,
        view:      s.view,
        rate:      s.rate,
        imageUrl:  s.imageUrl || undefined,
        imageKind: s.imageKind || undefined,
      }))
    : dict.rooms

  const tables = dbRestaurants.length > 0
    ? dbRestaurants.map(r => ({
        name:     isFr ? r.nameFr : r.nameEn,
        lede:     isFr ? r.ledeFr : r.ledeEn,
        hours:    r.hours,
        imageUrl: r.imageUrl || undefined,
      }))
    : dict.tables

  const experiences = dbExperiences.length > 0
    ? dbExperiences.map(e => ({
        n:        e.n,
        name:     isFr ? e.nameFr : e.nameEn,
        when:     e.when,
        who:      e.who,
        lede:     isFr ? e.ledeFr : e.ledeEn,
        imageUrl: e.imageUrl || undefined,
      }))
    : dict.experiences

  // Merge DB treatments into hammam_section dict
  const hammamDict = dbTreatments.length > 0
    ? {
        ...dict.hammam_section,
        treatments: dbTreatments.map(t => ({
          name:     isFr ? t.nameFr : t.nameEn,
          duration: t.duration,
          price:    t.price,
        })),
      }
    : dict.hammam_section

  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <HeroCourtyard   dict={dict.hero}               lang={lang} />
      <Marquee         dict={dict.marquee} />
      <MaisonLetter    dict={dict.story} />
      <Suites          dict={dict.suites_section}      rooms={rooms}        lang={lang} />
      <CinematicBreak  dict={dict.cinematic} />
      <Tables          dict={dict.tables_section}      tables={tables}      lang={lang} />
      <Experiences     dict={dict.experiences_section} experiences={experiences} lang={lang} />
      <Hammam          dict={hammamDict}                lang={lang} />
      <Reviews         dict={dict.reviews_section} />
      <FAQ             dict={dict.faq_section}          lang={lang} />
      <Practical       dict={dict.practical} />
    </div>
  )
}
