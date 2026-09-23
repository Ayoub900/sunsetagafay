import { describe, expect, it } from 'vitest'
import { addDays, dayBucket, dayLabel, isValidIsoDate, isoToday, stayBucket, stayCovers, toIsoDate } from './dates'

const TODAY = '2026-09-12'

describe('dayBucket', () => {
  it('puts a single day in exactly one bucket', () => {
    expect(dayBucket('2026-09-12', TODAY)).toBe('TODAY')
    expect(dayBucket('2026-09-13', TODAY)).toBe('UPCOMING')
    expect(dayBucket('2026-10-01', TODAY)).toBe('UPCOMING')
    expect(dayBucket('2026-09-11', TODAY)).toBe('PAST')
    expect(dayBucket('2025-12-31', TODAY)).toBe('PAST')
  })

  it('leaves today out of Upcoming', () => {
    expect(dayBucket(TODAY, TODAY)).not.toBe('UPCOMING')
  })

  it('has no bucket for a missing day', () => {
    expect(dayBucket('', TODAY)).toBe(null)
    expect(dayBucket(null, TODAY)).toBe(null)
  })
})

describe('stayBucket', () => {
  it('counts a stay the maison is holding today as Today', () => {
    expect(stayBucket('2026-09-12', '2026-09-15', TODAY)).toBe('TODAY') // arriving
    expect(stayBucket('2026-09-10', '2026-09-15', TODAY)).toBe('TODAY') // in house
    expect(stayBucket('2026-09-08', '2026-09-12', TODAY)).toBe('TODAY') // leaving
    expect(stayBucket('2026-09-12', '2026-09-12', TODAY)).toBe('TODAY') // day use
  })

  it('separates stays that have not started from ones that ended', () => {
    expect(stayBucket('2026-09-13', '2026-09-16', TODAY)).toBe('UPCOMING')
    expect(stayBucket('2026-09-05', '2026-09-11', TODAY)).toBe('PAST')
  })

  it('falls back to the arrival day when the departure is unreadable', () => {
    expect(stayBucket('2026-09-12', null, TODAY)).toBe('TODAY')
    expect(stayBucket('2026-09-11', null, TODAY)).toBe('PAST')
  })

  it('has no bucket for a stay whose dates cannot be read', () => {
    expect(stayBucket(null, '2026-09-15', TODAY)).toBe(null)
  })
})

describe('isoToday', () => {
  it('is YYYY-MM-DD, whatever the host locale data', () => {
    expect(isoToday(Date.parse('2026-09-12T10:00:00Z'))).toBe('2026-09-12')
  })

  it('answers for the maison, not for UTC', () => {
    // 23:30 UTC is already the next day in Agafay (UTC+1). A server-local
    // "today" in UTC would hide the bookings the desk is looking at.
    expect(isoToday(Date.parse('2026-09-12T23:30:00Z'))).toBe('2026-09-13')
    expect(isoToday(Date.parse('2026-09-12T00:30:00Z'))).toBe('2026-09-12')
  })
})

describe('isValidIsoDate', () => {
  it('accepts real days only', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('2026-2-8')).toBe(false)
    expect(isValidIsoDate('14 May 2026')).toBe(false)
  })
})

describe('addDays', () => {
  it('crosses months and years', () => {
    expect(addDays('2026-09-12', 1)).toBe('2026-09-13')
    expect(addDays('2026-09-30', 2)).toBe('2026-10-02')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-09-12', 0)).toBe('2026-09-12')
  })
})

describe('toIsoDate', () => {
  it('passes ISO through', () => {
    expect(toIsoDate('2026-05-14')).toBe('2026-05-14')
    expect(toIsoDate(' 2026-05-14 ')).toBe('2026-05-14')
  })

  it('reads the dates the desk types', () => {
    expect(toIsoDate('14 May 2026')).toBe('2026-05-14')
    expect(toIsoDate('4 mai 2026')).toBe('2026-05-04')
    expect(toIsoDate('1er août 2026')).toBe('2026-08-01')
    expect(toIsoDate('14 Juillet 2026')).toBe('2026-07-14')
    expect(toIsoDate('3 juin 2026')).toBe('2026-06-03')
    expect(toIsoDate('2 Déc. 2026')).toBe('2026-12-02')
    expect(toIsoDate('May 14, 2026')).toBe('2026-05-14')
    expect(toIsoDate('Sept 1 2026')).toBe('2026-09-01')
    expect(toIsoDate('May 3rd, 2026')).toBe('2026-05-03')
  })

  it('reads numeric dates day-first', () => {
    expect(toIsoDate('03/02/2026')).toBe('2026-02-03')
    expect(toIsoDate('3.2.2026')).toBe('2026-02-03')
    expect(toIsoDate('14-05-2026')).toBe('2026-05-14')
  })

  it('returns null rather than guessing', () => {
    expect(toIsoDate('')).toBe(null)
    expect(toIsoDate(null)).toBe(null)
    expect(toIsoDate('to be confirmed')).toBe(null)
    expect(toIsoDate('next Tuesday')).toBe(null)
    expect(toIsoDate('30 February 2026')).toBe(null)
    expect(toIsoDate('14 Smith 2026')).toBe(null)
    expect(toIsoDate('2026')).toBe(null)
  })
})

describe('stayCovers', () => {
  it('holds the stay on arrival, in-house and departure days', () => {
    expect(stayCovers('2026-09-10', '2026-09-14', '2026-09-10')).toBe(true)
    expect(stayCovers('2026-09-10', '2026-09-14', '2026-09-12')).toBe(true)
    expect(stayCovers('2026-09-10', '2026-09-14', '2026-09-14')).toBe(true)
  })

  it('leaves out days outside the stay', () => {
    expect(stayCovers('2026-09-10', '2026-09-14', '2026-09-09')).toBe(false)
    expect(stayCovers('2026-09-10', '2026-09-14', '2026-09-15')).toBe(false)
  })

  it('reads a stay with no end as one day, and one with no start as none', () => {
    expect(stayCovers('2026-09-10', null, '2026-09-10')).toBe(true)
    expect(stayCovers('2026-09-10', null, '2026-09-11')).toBe(false)
    expect(stayCovers(null, '2026-09-14', '2026-09-12')).toBe(false)
  })
})

describe('dayLabel', () => {
  it('prints the day it was given, whatever the host timezone', () => {
    expect(dayLabel('2026-09-23')).toMatch(/^Wed 23 Sep/)
    expect(dayLabel('2026-01-01')).toMatch(/^Thu 1 Jan 2026$/)
  })

  it('hands back text it cannot read', () => {
    expect(dayLabel('soon')).toBe('soon')
  })
})
