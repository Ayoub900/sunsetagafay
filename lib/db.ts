import { prisma } from './prisma'
import { blockClosesWholeType, blockCovers, serviceAllLabel, serviceTypeLabel } from './services'

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

// Returns active suites that have no overlapping non-cancelled reservation and
// are not covered by an admin availability block for the requested range.
// Dates are stored as ISO strings (YYYY-MM-DD); lexicographic comparison is
// equivalent to chronological comparison for that format.
export async function getAvailableSuites(checkIn: string, checkOut: string) {
  const [suites, reservations, blocks] = await Promise.all([
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
    getOverlappingBlocks(checkIn, checkOut),
  ])

  // A whole-property block, or an all-suites block, closes every suite for the
  // range — nothing is bookable.
  if (blocks.some(b => blockClosesWholeType(b, 'suite'))) return []

  const bookedNames = new Set(reservations.map(r => r.suite))
  const blockedSuiteIds = new Set(
    blocks.filter(b => b.serviceType === 'suite' && b.serviceId).map(b => b.serviceId),
  )
  return suites.filter(s => !bookedNames.has(s.nameEn) && !blockedSuiteIds.has(s.id))
}

// ─── Availability Blocks ─────────────────────────────────────────

export const getAvailabilityBlocks = () =>
  prisma.availabilityBlock.findMany({ orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }] })

export const getAvailabilityBlockById = (id: string) =>
  prisma.availabilityBlock.findUnique({ where: { id } })

// Blocks whose inclusive date range [startDate, endDate] overlaps a stay of
// [checkIn (inclusive), checkOut (exclusive)). Overlap holds when the block
// starts before the guest departs AND ends on or after the guest arrives.
export const getOverlappingBlocks = (checkIn: string, checkOut: string) =>
  prisma.availabilityBlock.findMany({
    where: {
      startDate: { lt: checkOut },
      endDate:   { gte: checkIn },
    },
  })

// Blocks covering one single date — the shape day passes and transfers need,
// since they are booked for a day rather than a range of nights.
export const getBlocksForDate = (date: string) =>
  prisma.availabilityBlock.findMany({
    where: {
      startDate: { lte: date },
      endDate:   { gte: date },
    },
  })

// True if the given suite is blocked for the range, whether by a whole-property
// block, an all-suites block, or a block on that specific suite.
export async function isSuiteBlocked(suiteName: string, checkIn: string, checkOut: string) {
  const [suite, blocks] = await Promise.all([
    prisma.suite.findFirst({ where: { nameEn: suiteName } }),
    getOverlappingBlocks(checkIn, checkOut),
  ])
  return blocks.some(b => blockCovers(b, 'suite', suite?.id ?? ''))
}

/**
 * True if a day pass / transfer is closed on `date`, by a whole-property block,
 * an all-day-passes / all-transfers block, or a block on that exact item.
 * `serviceType` is 'day-pass' | 'transfer'; `itemId` is the DayPass/Transfer id.
 */
export async function isServiceBlockedOnDate(
  serviceType: string,
  itemId: string,
  date: string,
): Promise<boolean> {
  const blocks = await getBlocksForDate(date)
  return blocks.some(b => blockCovers(b, serviceType, itemId))
}

// Every reservable item, grouped by service type, for the block picker. Includes
// inactive items so an admin can still close something that is currently hidden.
export async function getReservableServices() {
  const [suites, restaurants, dayPasses, parties, events, experiences, transfers, treatments] =
    await Promise.all([
      prisma.suite.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.restaurant.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.dayPass.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.sunsetParty.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.event.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.experience.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.transfer.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      prisma.treatment.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    ])
  const map = (rows: { id: string; nameEn: string }[]) =>
    rows.map(r => ({ id: r.id, name: r.nameEn }))
  return {
    suite:          map(suites),
    restaurant:     map(restaurants),
    'day-pass':     map(dayPasses),
    'sunset-party': map(parties),
    event:          map(events),
    experience:     map(experiences),
    transfer:       map(transfers),
    treatment:      map(treatments),
  } as Record<string, { id: string; name: string }[]>
}

// Resolves the display name for a service reference at block-creation time.
export async function resolveServiceName(type: string, id: string): Promise<string> {
  if (!type) return 'Entire property'
  if (!id)   return serviceAllLabel(type)

  const finders: Record<string, () => Promise<{ nameEn: string } | null>> = {
    suite:          () => prisma.suite.findUnique({ where: { id } }),
    restaurant:     () => prisma.restaurant.findUnique({ where: { id } }),
    'day-pass':     () => prisma.dayPass.findUnique({ where: { id } }),
    'sunset-party': () => prisma.sunsetParty.findUnique({ where: { id } }),
    event:          () => prisma.event.findUnique({ where: { id } }),
    experience:     () => prisma.experience.findUnique({ where: { id } }),
    transfer:       () => prisma.transfer.findUnique({ where: { id } }),
    treatment:      () => prisma.treatment.findUnique({ where: { id } }),
  }
  const item = await finders[type]?.()
  return item?.nameEn ?? serviceTypeLabel(type)
}

// ─── Orders (CMI payments) ───────────────────────────────────────────────────

export const getOrders = () =>
  prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })

// ─── Day pass / transfer bookings ──────────────────────────────────────────

// Newest first, with the payment order attached so the admin can see at a
// glance whether a booking was actually paid.
export const getServiceBookings = () =>
  prisma.serviceBooking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { orders: true },
    take: 200,
  })

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
