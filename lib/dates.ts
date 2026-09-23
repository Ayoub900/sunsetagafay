// Calendar days, as the rest of this app stores them: plain `YYYY-MM-DD`
// strings, compared lexicographically (which is also chronological for that
// format). No Date objects cross a module boundary here on purpose — a Date is
// an instant, and "which day is it?" is a question about a timezone, not an
// instant.
//
// The timezone is the maison's, not the server's and not the viewer's. A booking
// date is the day the guest arrives in Agafay, so the only reading of "today"
// that the desk can act on is the day it is there. Vercel runs functions in UTC,
// so a server-local `toLocaleDateString()` silently answered for a different day
// than the one staff were standing in.

export const BUSINESS_TZ = 'Africa/Casablanca'

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})

/** Today in the maison's timezone, as `YYYY-MM-DD`. */
export function isoToday(now: number | Date = Date.now()): string {
  // Assembled from parts rather than trusting the locale to print ISO order:
  // a runtime built without full ICU falls back to en-US and would hand back
  // "09/12/2026", which compares as a date against nothing at all.
  const parts = dayFormat.formatToParts(new Date(now))
  const at = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${at('year')}-${at('month')}-${at('day')}`
}

// What the admin date filters offer. The three are exclusive, so a row lands in
// exactly one of them and "Upcoming" means after today rather than including it
// — a Today chip that quietly also counts as Upcoming is how a date filter ends
// up looking broken.
export type DayBucket = 'TODAY' | 'UPCOMING' | 'PAST'

/** Where a single day sits relative to today. Null when there is no day. */
export function dayBucket(day: string | null, today: string): DayBucket | null {
  if (!day) return null
  if (day === today) return 'TODAY'
  return day > today ? 'UPCOMING' : 'PAST'
}

/**
 * Where a stay sits relative to today. TODAY is any stay the maison is holding
 * today — arriving, in house or leaving — because that is the list a desk asks
 * for. Null when the stay has no readable start.
 */
export function stayBucket(start: string | null, end: string | null, today: string): DayBucket | null {
  if (!start) return null
  if (start > today) return 'UPCOMING'
  if ((end ?? start) < today) return 'PAST'
  return 'TODAY'
}

/**
 * Whether the maison is holding a stay on `day`: arriving, in house or
 * leaving. This is how `stayBucket` reads TODAY, applied to any day.
 */
export function stayCovers(start: string | null, end: string | null, day: string): boolean {
  if (!start) return false
  return start <= day && (end ?? start) >= day
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Whether a string is a real `YYYY-MM-DD` day (rejects 2026-02-30). */
export function isValidIsoDate(s: string): boolean {
  if (!ISO_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** `YYYY-MM-DD` shifted by whole days. */
export function addDays(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(t)) return iso
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10)
}

const dayLabelFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
})

/** `YYYY-MM-DD` as "Wed 23 Sep 2026", read at UTC midnight so no timezone can shift the day. */
export function dayLabel(iso: string): string {
  const t = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(t)) return iso
  // From parts: en-GB's own join is "Wed, 23 Sept 2026" on current ICU.
  const parts = dayLabelFormat.formatToParts(t)
  const at = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${at('weekday')} ${at('day')} ${at('month').slice(0, 3)} ${at('year')}`
}

// English and French month names, longest keys first so "juillet" is not read
// as "juin". Matched on an accent-stripped prefix, so "Août", "aout" and "AOU"
// all land on 8.
const MONTHS: [string, number][] = [
  ['juil', 7], ['juin', 6],
  ['jan', 1], ['feb', 2], ['fev', 2], ['mar', 3], ['apr', 4], ['avr', 4],
  ['may', 5], ['mai', 5], ['jun', 6], ['jul', 7], ['aug', 8], ['aou', 8],
  ['sep', 9], ['oct', 10], ['nov', 11], ['dec', 12],
]

function monthOf(name: string): number | null {
  const k = name.normalize('NFD').replace(/[\u0300-\u036f.]/g, '').toLowerCase()
  return MONTHS.find(([prefix]) => k.startsWith(prefix))?.[1] ?? null
}

const pad = (n: number) => String(n).padStart(2, '0')

// The shapes a human actually types into the reservation form. Day-first for the
// numeric ones: this is a French-speaking desk, so 03/02/2026 is 3 February.
const NUMERIC_RE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/
const DAY_MONTH_RE = /^(\d{1,2})(?:er)?\s+([^\s\d]+)\.?,?\s+(\d{4})$/
const MONTH_DAY_RE = /^([^\s\d]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/

/**
 * Best-effort calendar day from whatever is stored in a free-text date field.
 *
 * Reservations typed at the desk hold things like "14 May 2026", while ones
 * booked on the site hold "2026-05-14". Returns `null` rather than guessing
 * when the text is not a date — the date filters then leave that row out
 * instead of quietly placing it on the wrong day.
 */
export function toIsoDate(value: string | null | undefined): string | null {
  const s = (value ?? '').trim()
  if (!s) return null

  const build = (y: string | number, m: number, d: number) => {
    const iso = `${y}-${pad(m)}-${pad(d)}`
    return isValidIsoDate(iso) ? iso : null
  }

  if (ISO_RE.test(s)) return isValidIsoDate(s) ? s : null

  const numeric = NUMERIC_RE.exec(s)
  if (numeric) return build(numeric[3], Number(numeric[2]), Number(numeric[1]))

  const dayFirst = DAY_MONTH_RE.exec(s)
  if (dayFirst) {
    const m = monthOf(dayFirst[2])
    return m ? build(dayFirst[3], m, Number(dayFirst[1])) : null
  }

  const monthFirst = MONTH_DAY_RE.exec(s)
  if (monthFirst) {
    const m = monthOf(monthFirst[1])
    return m ? build(monthFirst[3], m, Number(monthFirst[2])) : null
  }

  return null
}
