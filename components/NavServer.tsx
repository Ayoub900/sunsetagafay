import {
  getActiveSuites,
  getActiveRestaurants,
  getActiveEvents,
  getActiveSunsetParties,
  getActiveDayPasses,
  getActiveTransfers,
  arePartiesEnabled,
} from '@/lib/db'
import { Nav, type NavDict, type NavDropdownItem } from './Nav'

const TOP_N = 4

type Localized = { slug: string; nameEn: string; nameFr: string }

const pick = (arr: Localized[], lang: 'en' | 'fr'): NavDropdownItem[] =>
  arr.slice(0, TOP_N).map(x => ({
    slug: x.slug,
    label: lang === 'fr' ? x.nameFr : x.nameEn,
  }))

export async function NavServer({ lang, dict }: { lang: 'en' | 'fr'; dict: NavDict }) {
  const [suites, restaurants, events, parties, dayPasses, transfers, partiesOn] = await Promise.all([
    getActiveSuites(),
    getActiveRestaurants(),
    getActiveEvents(),
    getActiveSunsetParties(),
    getActiveDayPasses(),
    getActiveTransfers(),
    arePartiesEnabled(),
  ])
  return (
    <Nav
      lang={lang}
      dict={dict}
      items={{
        suites: pick(suites, lang),
        restaurants: pick(restaurants, lang),
        events: pick(events, lang),
        parties: partiesOn ? pick(parties, lang) : [],
        partiesEnabled: partiesOn,
        dayPasses: pick(dayPasses, lang),
        transfers: pick(transfers, lang),
      }}
    />
  )
}
