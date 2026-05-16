import {
  getActiveSuites,
  getActiveRestaurants,
  getActiveEvents,
  getActiveSunsetParties,
  getActiveTransfers,
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
  const [suites, restaurants, events, parties, transfers] = await Promise.all([
    getActiveSuites(),
    getActiveRestaurants(),
    getActiveEvents(),
    getActiveSunsetParties(),
    getActiveTransfers(),
  ])
  return (
    <Nav
      lang={lang}
      dict={dict}
      items={{
        suites: pick(suites, lang),
        restaurants: pick(restaurants, lang),
        events: pick(events, lang),
        parties: pick(parties, lang),
        transfers: pick(transfers, lang),
      }}
    />
  )
}
