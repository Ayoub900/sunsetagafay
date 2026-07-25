// Catalogue of everything a guest can reserve or inquire about, used by the
// admin availability-block picker and its list. Client-safe (no prisma import),
// so it can be shared with client components.
//
// NOTE on enforcement: only suites have an automated, date-based booking engine
// (/api/availability + /api/book), so a suite block is enforced automatically.
// Every other type is inquiry-only (contact form), so a block on it is recorded
// as a staff-visible closure but is not auto-gated on the public site.

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
  { type: 'day-pass',     label: 'Day pass',     allLabel: 'All day passes',     enforced: false },
  { type: 'sunset-party', label: 'Sunset party', allLabel: 'All sunset parties', enforced: false },
  { type: 'event',        label: 'Event',        allLabel: 'All events',         enforced: false },
  { type: 'experience',   label: 'Experience',   allLabel: 'All experiences',    enforced: false },
  { type: 'transfer',     label: 'Transfer',     allLabel: 'All transfers',      enforced: false },
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
