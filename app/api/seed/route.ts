import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import enDict from '@/app/dictionaries/en.json'
import frDict from '@/app/dictionaries/fr.json'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'

// Reseed endpoint — wipes all content collections and repopulates from dictionaries.
// AdminUser, Reservation, Guest, and ContactMessage are never touched.
// POST /api/seed  with  Authorization: Bearer <ADMIN_TOKEN>

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)
  const rl = rateLimit(`seed:${ip}`, 5, 60 * 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Wipe content collections ──────────────────────────────────────────────
  await Promise.all([
    prisma.suite.deleteMany({}),
    prisma.restaurant.deleteMany({}),
    prisma.experience.deleteMany({}),
    prisma.event.deleteMany({}),
    prisma.sunsetParty.deleteMany({}),
    prisma.dayPass.deleteMany({}),
    prisma.transfer.deleteMany({}),
    prisma.treatment.deleteMany({}),
  ])

  // ── Suites ────────────────────────────────────────────────────────────────
  const imageKinds = ['palms', 'courtyard', 'sunset', 'aperitif'] as const
  await Promise.all(enDict.rooms.map((en, i) => {
    const fr = frDict.rooms[i]
    const slug = en.name.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[^a-z0-9-]/g, '')
    return prisma.suite.create({
      data: {
        slug,
        nameEn:    en.name,
        nameFr:    fr?.name ?? en.name,
        briefEn:   en.brief,
        briefFr:   fr?.brief ?? en.brief,
        area:      en.area,
        view:      en.view,
        rate:      en.rate,
        imageKind: imageKinds[i % imageKinds.length],
        active:    true,
        order:     i,
      },
    })
  }))

  // ── Restaurants ───────────────────────────────────────────────────────────
  await Promise.all(enDict.tables.map((en, i) => {
    const fr = frDict.tables[i]
    const slug = en.name.toLowerCase().replace(/[\s']/g, '-').replace(/[éèê]/g, 'e').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return prisma.restaurant.create({
      data: {
        slug,
        nameEn: en.name,
        nameFr: fr?.name ?? en.name,
        ledeEn: en.lede,
        ledeFr: fr?.lede ?? en.lede,
        copyEn: en.copy,
        copyFr: fr?.copy ?? en.copy,
        hours:  en.hours,
        active: true,
        order:  i,
      },
    })
  }))

  // ── Experiences ───────────────────────────────────────────────────────────
  await Promise.all(enDict.experiences.map((en, i) => {
    const fr = frDict.experiences[i]
    return prisma.experience.create({
      data: {
        n:      en.n,
        nameEn: en.name,
        nameFr: fr?.name ?? en.name,
        when:   en.when,
        who:    en.who,
        ledeEn: en.lede,
        ledeFr: fr?.lede ?? en.lede,
        active: true,
        order:  i,
      },
    })
  }))

  // ── Events ────────────────────────────────────────────────────────────────
  await Promise.all(enDict.events_section.types.map((en, i) => {
    const fr = frDict.events_section.types[i]
    const slug = en.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return prisma.event.create({
      data: {
        slug,
        nameEn:   en.name,
        nameFr:   fr?.name ?? en.name,
        ledeEn:   en.lede ?? '',
        ledeFr:   fr?.lede ?? en.lede ?? '',
        copyEn:   en.copy,
        copyFr:   fr?.copy ?? en.copy,
        capacity: en.capacity,
        active:   true,
        order:    i,
      },
    })
  }))

  // ── Sunset Parties ────────────────────────────────────────────────────────
  const enParties = enDict.sunset_parties_page.parties
  const frParties = frDict.sunset_parties_page.parties
  await Promise.all(enParties.map((en, i) => {
    const fr = frParties[i]
    return prisma.sunsetParty.create({
      data: {
        slug:     en.id,
        nameEn:   en.name,
        nameFr:   fr?.name ?? en.name,
        ledeEn:   en.lede,
        ledeFr:   fr?.lede ?? en.lede,
        copyEn:   en.copy,
        copyFr:   fr?.copy ?? en.copy,
        capacity: en.capacity,
        season:   en.season ?? 'All year',
        active:   true,
        order:    i,
      },
    })
  }))

  // ── Day Passes ────────────────────────────────────────────────────────────
  const dayPasses = [
    {
      slug: 'swimming-pool-dinner',
      nameEn: 'Day Pass Swimming Pool & Dinner',
      nameFr: 'Day Pass Piscine & Dîner',
      ledeEn: 'Sunset by the pool followed by dinner under the stars.',
      ledeFr: 'Coucher de soleil au bord de la piscine suivi d\'un dîner sous les étoiles.',
      copyEn: '<p>Join us at the White Camel Agafay for an extraordinary evening of relaxation, natural beauty, and gastronomic delight. Book your <strong>Day Pass Swimming Pool &amp; Dinner</strong> now and experience the magic of Agafay’s sunset while enjoying our luxurious swimming pool and savoring a memorable dinner.</p>',
      copyFr: '<p>Rejoignez-nous au White Camel Agafay pour une soirée extraordinaire de détente, de beauté naturelle et de délices gastronomiques. Réservez votre <strong>Day Pass Piscine &amp; Dîner</strong> et vivez la magie du coucher de soleil d\'Agafay en profitant de notre piscine et d\'un dîner mémorable.</p>',
      hours: '16:00 — 19:00',
      price: '55,00',
      currency: '€',
    },
    {
      slug: 'swimming-pool-lunch',
      nameEn: 'Day Pass Swimming Pool & Lunch',
      nameFr: 'Day Pass Piscine & Déjeuner',
      ledeEn: 'A long lunch by the pool with the Atlas as a backdrop.',
      ledeFr: 'Un long déjeuner au bord de la piscine avec l\'Atlas en toile de fond.',
      copyEn: '<p>Spend an afternoon at the White Camel Agafay with a <strong>Day Pass Swimming Pool &amp; Lunch</strong>. Lounge by the pool and enjoy a Moroccan lunch prepared by our chef.</p>',
      copyFr: '<p>Passez un après-midi au White Camel Agafay avec un <strong>Day Pass Piscine &amp; Déjeuner</strong>. Détendez-vous au bord de la piscine et savourez un déjeuner marocain préparé par notre chef.</p>',
      hours: '12:00 — 17:00',
      price: '55,00',
      currency: '€',
    },
    {
      slug: 'full-day-pass',
      nameEn: 'Full Day Pass (Lunch & Dinner)',
      nameFr: 'Day Pass Journée (Déjeuner & Dîner)',
      ledeEn: 'A complete day at the kasbah — pool, lunch, sunset, and dinner.',
      ledeFr: 'Une journée complète à la kasbah — piscine, déjeuner, coucher de soleil et dîner.',
      copyEn: '<p>Take in the entire day with our <strong>Full Day Pass</strong>. Includes pool access, lunch, sunset aperitif, and dinner under the stars.</p>',
      copyFr: '<p>Profitez de toute la journée avec notre <strong>Day Pass Journée</strong>. Comprend l\'accès à la piscine, le déjeuner, l\'apéritif au coucher du soleil et le dîner sous les étoiles.</p>',
      hours: '12:00 — 22:00',
      price: '95,00',
      currency: '€',
    },
  ]
  await Promise.all(dayPasses.map((d, i) =>
    prisma.dayPass.create({ data: { ...d, active: true, order: i } })
  ))

  // ── Transfers ─────────────────────────────────────────────────────────────
  const enTransfers = enDict.transfers_page.options
  const frTransfers = frDict.transfers_page.options
  await Promise.all(enTransfers.map((en, i) => {
    const fr = frTransfers[i]
    return prisma.transfer.create({
      data: {
        slug:     en.id,
        nameEn:   en.name,
        nameFr:   fr?.name ?? en.name,
        ledeEn:   en.lede,
        ledeFr:   fr?.lede ?? en.lede,
        copyEn:   en.copy,
        copyFr:   fr?.copy ?? en.copy,
        duration: en.duration,
        price:    en.price,
        active:   true,
        order:    i,
      },
    })
  }))

  // ── Treatments ────────────────────────────────────────────────────────────
  type TreatmentDict = { name: string; duration: string; price: string }
  const enTreatments = enDict.hammam_section.treatments as TreatmentDict[]
  const frTreatments = frDict.hammam_section.treatments as TreatmentDict[]
  await Promise.all(enTreatments.map((en, i) => {
    const fr = frTreatments[i]
    return prisma.treatment.create({
      data: {
        nameEn:   en.name,
        nameFr:   fr?.name ?? en.name,
        duration: en.duration,
        price:    en.price,
        active:   true,
        order:    i,
      },
    })
  }))

  return NextResponse.json({
    ok: true,
    seeded: {
      suites:      enDict.rooms.length,
      restaurants: enDict.tables.length,
      experiences: enDict.experiences.length,
      events:      enDict.events_section.types.length,
      parties:     enParties.length,
      dayPasses:   dayPasses.length,
      transfers:   enTransfers.length,
      treatments:  enDict.hammam_section.treatments.length,
    },
  })
}
