// Catalogue of everything a guest can reserve or inquire about, used by the
// admin availability-block picker and its list. Client-safe (no prisma import),
// so it can be shared with client components.
//
// NOTE on enforcement: three types have an automated, date-based booking engine
// and their blocks are enforced automatically on the public site —
//   suite      → /api/availability (hides the suite) + /api/book (rejects)
//   day-pass   → /api/service-booking (rejects the date)
//   transfer   → /api/service-booking (rejects the date)
// and all three are re-checked at /api/payment/initiate, so a closure added
// after a booking was taken cannot still be paid for.
//
// The remaining types are inquiry-only (contact form), so a block on one is
// recorded as a staff-visible closure but is not auto-gated on the site.

export type ServiceType =
  | 'suite' | 'restaurant' | 'day-pass' | 'sunset-party'
  | 'event' | 'experience' | 'transfer' | 'treatment'

export interface ServiceTypeMeta {
  type:     ServiceType
  label:    string   // singular, e.g. "Suite"
  allLabel: string   // "all of type", e.g. "All suites"
  enforced: boolean  // true when a block actually gates public booking
}

export const SERVICE_TYPES: ServiceTypeMeta[] = [
  { type: 'suite',        label: 'Suite',        allLabel: 'All suites',         enforced: true  },
  { type: 'restaurant',   label: 'Restaurant',   allLabel: 'All restaurants',    enforced: false },
  { type: 'day-pass',     label: 'Day pass',     allLabel: 'All day passes',     enforced: true  },
  { type: 'sunset-party', label: 'Sunset party', allLabel: 'All sunset parties', enforced: false },
  { type: 'event',        label: 'Event',        allLabel: 'All events',         enforced: false },
  { type: 'experience',   label: 'Experience',   allLabel: 'All experiences',    enforced: false },
  { type: 'transfer',     label: 'Transfer',     allLabel: 'All transfers',      enforced: true  },
  { type: 'treatment',    label: 'Treatment',    allLabel: 'All treatments',     enforced: false },
]

const BY_TYPE = new Map(SERVICE_TYPES.map(s => [s.type, s]))

export function isServiceType(v: string): v is ServiceType {
  return BY_TYPE.has(v as ServiceType)
}

export function serviceTypeLabel(type: string): string {
  return BY_TYPE.get(type as ServiceType)?.label ?? type
}

export function serviceAllLabel(type: string): string {
  return BY_TYPE.get(type as ServiceType)?.allLabel ?? `All ${type}`
}

/** True when a block on this type actually stops a guest from booking. */
export function isServiceTypeEnforced(type: string): boolean {
  return BY_TYPE.get(type as ServiceType)?.enforced ?? false
}

/** The part of an AvailabilityBlock that says WHAT it closes. */
export interface BlockScope {
  serviceType: string
  serviceId: string
}

/**
 * Does this block cover the given item? The single place the three scopes are
 * interpreted, so every booking entry point agrees:
 *
 *   { serviceType: '' }                        → the entire property
 *   { serviceType: 'transfer', serviceId: '' }  → every transfer
 *   { serviceType: 'transfer', serviceId: 'x' } → only transfer x
 *
 * Dates are NOT considered here — the caller has already narrowed the blocks to
 * the range or day it cares about.
 */
export function blockCovers(block: BlockScope, serviceType: string, itemId: string): boolean {
  if (!block.serviceType) return true
  if (block.serviceType !== serviceType) return false
  return !block.serviceId || block.serviceId === itemId
}

/** Does this block close every item of the given type (not just one)? */
export function blockClosesWholeType(block: BlockScope, serviceType: string): boolean {
  return !block.serviceType || (block.serviceType === serviceType && !block.serviceId)
}
