import type { MetadataRoute } from 'next'
import { getActiveSuites, getActiveRestaurants, getActiveEvents, getActiveSunsetParties, getActiveTransfers } from '@/lib/db'

const BASE = 'https://sunsetagafay.com'
const LOCALES = ['en', 'fr'] as const

function localeUrls(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], lastModified?: Date) {
  return LOCALES.map(lang => ({
    url: `${BASE}/${lang}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [suites, restaurants, events, parties, transfers] = await Promise.all([
    getActiveSuites(),
    getActiveRestaurants(),
    getActiveEvents(),
    getActiveSunsetParties(),
    getActiveTransfers(),
  ])

  const staticPages = [
    ...localeUrls('', 1.0, 'weekly'),
    ...localeUrls('/suites', 0.9, 'weekly'),
    ...localeUrls('/restaurants', 0.8, 'monthly'),
    ...localeUrls('/experiences', 0.7, 'monthly'),
    ...localeUrls('/events', 0.7, 'monthly'),
    ...localeUrls('/sunset-parties', 0.7, 'monthly'),
    ...localeUrls('/transfers', 0.7, 'monthly'),
    ...localeUrls('/contact', 0.6, 'monthly'),
    ...localeUrls('/reserve', 0.6, 'monthly'),
  ]

  const suitePages = suites.flatMap(s =>
    localeUrls(`/suites/${s.slug}`, 0.8, 'monthly', (s as { updatedAt?: Date }).updatedAt)
  )

  const restaurantPages = restaurants.flatMap(r =>
    localeUrls(`/restaurants/${r.slug}`, 0.8, 'monthly', (r as { updatedAt?: Date }).updatedAt)
  )

  const eventPages = events.flatMap(e =>
    localeUrls(`/events/${e.slug}`, 0.7, 'monthly', (e as { updatedAt?: Date }).updatedAt)
  )

  const partyPages = parties.flatMap(p =>
    localeUrls(`/sunset-parties/${p.slug}`, 0.7, 'monthly', (p as { updatedAt?: Date }).updatedAt)
  )

  const transferPages = transfers.flatMap(t =>
    localeUrls(`/transfers/${t.slug}`, 0.6, 'monthly', (t as { updatedAt?: Date }).updatedAt)
  )

  return [
    ...staticPages,
    ...suitePages,
    ...restaurantPages,
    ...eventPages,
    ...partyPages,
    ...transferPages,
  ]
}
