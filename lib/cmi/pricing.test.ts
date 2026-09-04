import { describe, expect, it } from 'vitest'
import {
  dayPassAmountMadCents,
  transferAmountMadCents,
  formatMadLabel,
  MAX_CHARGE_MAD_CENTS,
} from './pricing'

describe('dayPassAmountMadCents', () => {
  it('charges every adult the pass price', () => {
    expect(dayPassAmountMadCents(3, 0, 60_000, 0)).toBe(180_000)
  })

  it('charges children at the child price', () => {
    expect(dayPassAmountMadCents(2, 2, 60_000, 30_000)).toBe(180_000)
  })

  it('treats a zero child price as children not charged', () => {
    expect(dayPassAmountMadCents(1, 4, 55_000, 0)).toBe(55_000)
  })

  it('never returns a negative amount from hostile counts', () => {
    expect(dayPassAmountMadCents(-5, -5, 60_000, 30_000)).toBe(0)
  })

  it('ignores fractional counts rather than producing fractional centimes', () => {
    expect(dayPassAmountMadCents(2.9, 0, 60_000, 0)).toBe(120_000)
  })
})

describe('transferAmountMadCents', () => {
  it('is flat per vehicle, independent of passengers', () => {
    expect(transferAmountMadCents(130_000)).toBe(130_000)
  })

  it('clamps a negative configured price to zero (i.e. not chargeable)', () => {
    expect(transferAmountMadCents(-1)).toBe(0)
  })
})

describe('formatMadLabel', () => {
  it('groups thousands and drops empty centimes', () => {
    expect(formatMadLabel(110_000)).toBe('1 100 MAD')
  })

  it('keeps centimes when present', () => {
    expect(formatMadLabel(110_050)).toBe('1 100,50 MAD')
  })

  it('formats a sub-thousand amount', () => {
    expect(formatMadLabel(55_000)).toBe('550 MAD')
  })
})

describe('MAX_CHARGE_MAD_CENTS', () => {
  it('is a sane ceiling for one online charge', () => {
    expect(MAX_CHARGE_MAD_CENTS).toBe(50_000_000)
  })
})
