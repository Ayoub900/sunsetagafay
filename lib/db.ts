import { prisma } from './prisma'

// ─── Suites ────────────────────────────────────────────────────────────────

export const getSuites = () =>
  prisma.suite.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveSuites = () =>
  prisma.suite.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getSuiteBySlug = (slug: string) =>
  prisma.suite.findUnique({ where: { slug } })

export const getSuiteById = (id: string) =>
  prisma.suite.findUnique({ where: { id } })

// ─── Restaurants ───────────────────────────────────────────────────────────

export const getRestaurants = () =>
  prisma.restaurant.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveRestaurants = () =>
  prisma.restaurant.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getRestaurantBySlug = (slug: string) =>
  prisma.restaurant.findUnique({ where: { slug } })

export const getRestaurantById = (id: string) =>
  prisma.restaurant.findUnique({ where: { id } })

// ─── Experiences ───────────────────────────────────────────────────────────

export const getExperiences = () =>
  prisma.experience.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveExperiences = () =>
  prisma.experience.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getExperienceById = (id: string) =>
  prisma.experience.findUnique({ where: { id } })

// ─── Events ────────────────────────────────────────────────────────────────

export const getEvents = () =>
  prisma.event.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveEvents = () =>
  prisma.event.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getEventBySlug = (slug: string) =>
  prisma.event.findUnique({ where: { slug } })

export const getEventById = (id: string) =>
  prisma.event.findUnique({ where: { id } })

// ─── Sunset Parties ────────────────────────────────────────────────────────

export const getSunsetParties = () =>
  prisma.sunsetParty.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveSunsetParties = () =>
  prisma.sunsetParty.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getSunsetPartyBySlug = (slug: string) =>
  prisma.sunsetParty.findUnique({ where: { slug } })

export const getSunsetPartyById = (id: string) =>
  prisma.sunsetParty.findUnique({ where: { id } })

// ─── Day Passes ────────────────────────────────────────────────────────────

export const getDayPasses = () =>
  prisma.dayPass.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveDayPasses = () =>
  prisma.dayPass.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getDayPassBySlug = (slug: string) =>
  prisma.dayPass.findUnique({ where: { slug } })

export const getDayPassById = (id: string) =>
  prisma.dayPass.findUnique({ where: { id } })

// ─── Transfers ─────────────────────────────────────────────────────────────

export const getTransfers = () =>
  prisma.transfer.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveTransfers = () =>
  prisma.transfer.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getTransferBySlug = (slug: string) =>
  prisma.transfer.findUnique({ where: { slug } })

export const getTransferById = (id: string) =>
  prisma.transfer.findUnique({ where: { id } })

// ─── Treatments ────────────────────────────────────────────────────────────

export const getTreatments = () =>
  prisma.treatment.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

export const getActiveTreatments = () =>
  prisma.treatment.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

export const getTreatmentById = (id: string) =>
  prisma.treatment.findUnique({ where: { id } })

// ─── Reservations ──────────────────────────────────────────────────────────

export const getReservations = () =>
  prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } })

export const getReservationById = (id: string) =>
  prisma.reservation.findUnique({ where: { id } })

// Returns active suites that have no overlapping non-cancelled reservation.
// Dates are stored as ISO strings (YYYY-MM-DD); lexicographic comparison is
// equivalent to chronological comparison for that format.
export async function getAvailableSuites(checkIn: string, checkOut: string) {
  const [suites, reservations] = await Promise.all([
    prisma.suite.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.reservation.findMany({
      where: {
        status: { notIn: ['Cancelled', 'Completed'] },
        checkIn:  { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
  ])
  const bookedNames = new Set(reservations.map(r => r.suite))
  return suites.filter(s => !bookedNames.has(s.nameEn))
}

// ─── Orders (CMI payments) ───────────────────────────────────────────────────

export const getOrders = () =>
  prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })

// Orders that need manual verification against the CMI Merchant Center:
// anything UNDER_RECONCILIATION, plus PENDING orders older than 1 hour.
export async function getOrdersNeedingAttention() {
  const staleBefore = new Date(Date.now() - 60 * 60_000)
  return prisma.order.findMany({
    where: {
      OR: [
        { status: 'UNDER_RECONCILIATION' },
        { status: 'PENDING', createdAt: { lt: staleBefore } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Contact Messages ──────────────────────────────────────────────────────

export const getContactMessages = () =>
  prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })

// ─── Guests ────────────────────────────────────────────────────────────────

export const getGuests = () =>
  prisma.guest.findMany({ orderBy: { name: 'asc' } })

export const getGuestById = (id: string) =>
  prisma.guest.findUnique({ where: { id } })

// ─── Site Settings ─────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { key: 'default' } })
  if (existing) return existing
  return prisma.siteSettings.create({ data: { key: 'default' } })
}

export async function arePartiesEnabled() {
  const s = await getSiteSettings()
  return s.partiesEnabled
}

// ─── Dashboard counts ──────────────────────────────────────────────────────

export async function getDashboardCounts() {
  const [suites, restaurants, experiences, events, parties, dayPasses, transfers, treatments, reservations, guests] =
    await Promise.all([
      prisma.suite.count(),
      prisma.restaurant.count(),
      prisma.experience.count(),
      prisma.event.count(),
      prisma.sunsetParty.count(),
      prisma.dayPass.count(),
      prisma.transfer.count(),
      prisma.treatment.count(),
      prisma.reservation.count(),
      prisma.guest.count(),
    ])
  return { suites, restaurants, experiences, events, parties, dayPasses, transfers, treatments, reservations, guests }
}
