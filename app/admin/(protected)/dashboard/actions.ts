'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import enDict from '@/app/dictionaries/en.json'
import frDict from '@/app/dictionaries/fr.json'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

export async function seedDatabase(): Promise<{ ok: boolean; seeded?: Record<string, number>; error?: string }> {
  await guard()

  try {
    // Wipe all content collections — AdminUser, Reservation, Guest, ContactMessage are untouched
    await Promise.all([
      prisma.suite.deleteMany({}),
      prisma.restaurant.deleteMany({}),
      prisma.experience.deleteMany({}),
      prisma.event.deleteMany({}),
      prisma.sunsetParty.deleteMany({}),
      prisma.transfer.deleteMany({}),
      prisma.treatment.deleteMany({}),
    ])

    // Suites
    const imageKinds = ['palms', 'courtyard', 'sunset', 'aperitif'] as const
    await Promise.all(enDict.rooms.map((en, i) => {
      const fr = frDict.rooms[i]
      const slug = en.name.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[^a-z0-9-]/g, '')
      return prisma.suite.create({
        data: { slug, plate: en.plate, nameEn: en.name, nameFr: fr?.name ?? en.name, briefEn: en.brief, briefFr: fr?.brief ?? en.brief, area: en.area, view: en.view, rate: en.rate, imageKind: imageKinds[i % imageKinds.length], active: true, order: i },
      })
    }))

    // Restaurants
    await Promise.all(enDict.tables.map((en, i) => {
      const fr = frDict.tables[i]
      const slug = en.name.toLowerCase().replace(/[\s']/g, '-').replace(/[éèê]/g, 'e').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
      return prisma.restaurant.create({
        data: { slug, plate: en.n, nameEn: en.name, nameFr: fr?.name ?? en.name, ledeEn: en.lede, ledeFr: fr?.lede ?? en.lede, copyEn: en.copy, copyFr: fr?.copy ?? en.copy, hours: en.hours, active: true, order: i },
      })
    }))

    // Experiences
    await Promise.all(enDict.experiences.map((en, i) => {
      const fr = frDict.experiences[i]
      return prisma.experience.create({
        data: { n: en.n, nameEn: en.name, nameFr: fr?.name ?? en.name, when: en.when, who: en.who, ledeEn: en.lede, ledeFr: fr?.lede ?? en.lede, active: true, order: i },
      })
    }))

    // Events
    await Promise.all(enDict.events_section.types.map((en, i) => {
      const fr = frDict.events_section.types[i]
      const slug = en.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return prisma.event.create({
        data: { slug, nameEn: en.name, nameFr: fr?.name ?? en.name, ledeEn: en.lede ?? '', ledeFr: fr?.lede ?? en.lede ?? '', copyEn: en.copy, copyFr: fr?.copy ?? en.copy, capacity: en.capacity, active: true, order: i },
      })
    }))

    // Sunset Parties
    const enParties = enDict.sunset_parties_page.parties
    const frParties = frDict.sunset_parties_page.parties
    await Promise.all(enParties.map((en, i) => {
      const fr = frParties[i]
      return prisma.sunsetParty.create({
        data: { slug: en.id, nameEn: en.name, nameFr: fr?.name ?? en.name, ledeEn: en.lede, ledeFr: fr?.lede ?? en.lede, copyEn: en.copy, copyFr: fr?.copy ?? en.copy, capacity: en.capacity, season: en.season ?? 'All year', active: true, order: i },
      })
    }))

    // Transfers
    const enTransfers = enDict.transfers_page.options
    const frTransfers = frDict.transfers_page.options
    await Promise.all(enTransfers.map((en, i) => {
      const fr = frTransfers[i]
      return prisma.transfer.create({
        data: { slug: en.id, nameEn: en.name, nameFr: fr?.name ?? en.name, ledeEn: en.lede, ledeFr: fr?.lede ?? en.lede, copyEn: en.copy, copyFr: fr?.copy ?? en.copy, duration: en.duration, price: en.price, active: true, order: i },
      })
    }))

    // Treatments
    await Promise.all(enDict.hammam_section.treatments.map((en, i) => {
      const fr = frDict.hammam_section.treatments[i]
      return prisma.treatment.create({
        data: { nameEn: en.name, nameFr: fr?.name ?? en.name, duration: en.duration, price: en.price, active: true, order: i },
      })
    }))

    revalidatePath('/admin/dashboard')
    revalidatePath('/[lang]', 'layout')
    return {
      ok: true,
      seeded: {
        suites:      enDict.rooms.length,
        restaurants: enDict.tables.length,
        experiences: enDict.experiences.length,
        events:      enDict.events_section.types.length,
        parties:     enParties.length,
        transfers:   enTransfers.length,
        treatments:  enDict.hammam_section.treatments.length,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
