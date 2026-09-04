import { describe, expect, it } from 'vitest'
import {
  blockClosesWholeType,
  blockCovers,
  isServiceType,
  isServiceTypeEnforced,
  serviceAllLabel,
  serviceTypeLabel,
} from './services'

// The three scopes an availability block can have.
const property = { serviceType: '', serviceId: '' }
const allTransfers = { serviceType: 'transfer', serviceId: '' }
const oneTransfer = { serviceType: 'transfer', serviceId: 'transfer-1' }
const allPasses = { serviceType: 'day-pass', serviceId: '' }
const oneSuite = { serviceType: 'suite', serviceId: 'suite-9' }

describe('blockCovers', () => {
  it('closes everything when no service type is set', () => {
    expect(blockCovers(property, 'transfer', 'transfer-1')).toBe(true)
    expect(blockCovers(property, 'day-pass', 'pass-1')).toBe(true)
    expect(blockCovers(property, 'suite', 'suite-9')).toBe(true)
  })

  it('closes every item of its type when no id is set', () => {
    expect(blockCovers(allTransfers, 'transfer', 'transfer-1')).toBe(true)
    expect(blockCovers(allTransfers, 'transfer', 'transfer-2')).toBe(true)
  })

  it('closes only the named item when an id is set', () => {
    expect(blockCovers(oneTransfer, 'transfer', 'transfer-1')).toBe(true)
    expect(blockCovers(oneTransfer, 'transfer', 'transfer-2')).toBe(false)
  })

  it('never leaks across service types', () => {
    expect(blockCovers(allTransfers, 'day-pass', 'pass-1')).toBe(false)
    expect(blockCovers(allPasses, 'transfer', 'transfer-1')).toBe(false)
    expect(blockCovers(oneSuite, 'day-pass', 'suite-9')).toBe(false)
  })

  it('does not match a specific-item block when the item is unknown', () => {
    // e.g. a suite looked up by name that no longer exists
    expect(blockCovers(oneSuite, 'suite', '')).toBe(false)
    expect(blockCovers(allTransfers, 'transfer', '')).toBe(true)
  })
})

describe('blockClosesWholeType', () => {
  it('is true for a property-wide block and an all-of-type block', () => {
    expect(blockClosesWholeType(property, 'suite')).toBe(true)
    expect(blockClosesWholeType(allTransfers, 'transfer')).toBe(true)
  })

  it('is false for a single-item block, which leaves the others open', () => {
    expect(blockClosesWholeType(oneTransfer, 'transfer')).toBe(false)
    expect(blockClosesWholeType(oneSuite, 'suite')).toBe(false)
  })

  it('is false for another type', () => {
    expect(blockClosesWholeType(allTransfers, 'suite')).toBe(false)
  })
})

describe('service catalogue', () => {
  it('recognises the known types and rejects anything else', () => {
    expect(isServiceType('day-pass')).toBe(true)
    expect(isServiceType('transfer')).toBe(true)
    expect(isServiceType('spaceship')).toBe(false)
  })

  it('marks the online-bookable types as enforced', () => {
    for (const t of ['suite', 'day-pass', 'transfer']) {
      expect(isServiceTypeEnforced(t)).toBe(true)
    }
  })

  it('marks inquiry-only types as not enforced', () => {
    for (const t of ['restaurant', 'event', 'experience', 'treatment', 'sunset-party']) {
      expect(isServiceTypeEnforced(t)).toBe(false)
    }
    expect(isServiceTypeEnforced('unknown')).toBe(false)
  })

  it('labels types for the admin list', () => {
    expect(serviceTypeLabel('day-pass')).toBe('Day pass')
    expect(serviceAllLabel('transfer')).toBe('All transfers')
    expect(serviceTypeLabel('mystery')).toBe('mystery')
  })
})
