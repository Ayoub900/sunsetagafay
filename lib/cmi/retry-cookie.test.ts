import { describe, expect, it } from 'vitest'
import { PAY_REF_COOKIE, parsePayRef, payRefCookie } from './retry-cookie'
import { isObjectId } from './util'

const RES = '6a9b1748a21c895ddc0332db'
const SVC = '507f1f77bcf86cd799439011'

describe('isObjectId', () => {
  it('accepts a 24-char hex id in either case', () => {
    expect(isObjectId(RES)).toBe(true)
    expect(isObjectId(RES.toUpperCase())).toBe(true)
  })

  // The regression: these reached Prisma and threw, so /api/payment/initiate
  // answered 500 instead of the "booking not found" page.
  it.each(['FAKEID123', '', '   ', RES.slice(0, 23), RES + 'a', `${RES} `, 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
    'rejects %j',
    (bad) => expect(isObjectId(bad)).toBe(false),
  )
})

describe('payRefCookie', () => {
  it('round-trips a reservation ref', () => {
    const set = payRefCookie({ reservationId: RES })
    expect(set).toContain(`${PAY_REF_COOKIE}=r:${RES}`)
    expect(parsePayRef(`r:${RES}`)).toEqual({ reservationId: RES })
  })

  it('round-trips a service-booking ref', () => {
    const set = payRefCookie({ serviceBookingId: SVC })
    expect(set).toContain(`${PAY_REF_COOKIE}=s:${SVC}`)
    expect(parsePayRef(`s:${SVC}`)).toEqual({ serviceBookingId: SVC })
  })

  // The browser reaches /api/payment/fail via a cross-site POST from CMI, so a
  // Lax cookie would not be sent and the retry fallback would never fire.
  it('is HttpOnly, Secure and SameSite=None so it survives the CMI POST', () => {
    const set = payRefCookie({ reservationId: RES })
    expect(set).toContain('HttpOnly')
    expect(set).toContain('Secure')
    expect(set).toContain('SameSite=None')
    expect(set).toContain('Path=/')
  })
})

describe('parsePayRef', () => {
  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['no prefix', RES],
    ['unknown prefix', `x:${RES}`],
    ['malformed id', 'r:FAKEID123'],
    ['prefix only', 'r:'],
  ])('rejects %s', (_label, raw) => {
    expect(parsePayRef(raw as string | undefined)).toBeNull()
  })
})
