// The date the suites open for stays. Reservations cannot start before this date.
// Once this date has passed, the "opening soon" note on the suites page disappears
// and the booking flow no longer enforces a minimum check-in date.
export const SUITES_OPENING_DATE = '2026-07-01' // YYYY-MM-DD

// Effective earliest check-in date: whichever is later, today or the opening date.
export function minCheckInDate(today: string): string {
  return today > SUITES_OPENING_DATE ? today : SUITES_OPENING_DATE
}

// Whether the opening note should still be shown (true until the opening date passes).
export function suitesOpeningPending(now: Date = new Date()): boolean {
  return now.getTime() < Date.parse(`${SUITES_OPENING_DATE}T00:00:00Z`)
}
