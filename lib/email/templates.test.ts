import { describe, expect, it } from 'vitest'
import { buildAdminEmail, buildCustomerEmail, type PaymentEmailData } from './templates'

const base: PaymentEmailData = {
  kind: 'transfer',
  lang: 'en',
  itemName: 'Airport Day Transfer',
  reference: 'SA-F2BDC5',
  oid: 'SAMTLTQIWX853A7E8B8347',
  amountLabel: '1200.00 MAD',
  customerName: 'Amina B.',
  customerEmail: 'guest@example.com',
  customerPhone: '+212600000000',
  rows: [
    ['Date', '2026-10-02'],
    ['Pickup time', '08:45'],
    ['Passengers', '2 passengers'],
    ['Pickup', 'Marrakech-Menara Airport'],
    ['Drop-off', ''],
  ],
  adminRows: [
    ['Card', 'VISA 411111******1111'],
    ['Transaction', 'TX123'],
  ],
  notes: 'Flight AT201, two large cases',
  siteUrl: 'https://sunsetagafay.com',
}

describe('buildCustomerEmail', () => {
  it('leads with the confirmation and carries amount + reference', () => {
    const { subject, html, text } = buildCustomerEmail(base)
    expect(subject).toContain('SA-F2BDC5')
    expect(subject).toContain('Airport Day Transfer')
    expect(html).toContain('Your transfer is confirmed.')
    expect(html).toContain('1200.00 MAD')
    expect(html).toContain('SA-F2BDC5')
    expect(text).toContain('1200.00 MAD')
  })

  it('names the right thing for each kind', () => {
    expect(buildCustomerEmail({ ...base, kind: 'stay' }).html).toContain('Your stay is confirmed.')
    expect(buildCustomerEmail({ ...base, kind: 'day-pass' }).html).toContain('Your day pass is confirmed.')
  })

  it('writes to a French guest in French', () => {
    const { html, text } = buildCustomerEmail({ ...base, lang: 'fr' })
    expect(html).toContain('Votre transfert est confirmé.')
    expect(html).toContain('Montant payé')
    expect(text).toContain('Référence')
    expect(html).not.toContain('Your transfer is confirmed.')
  })

  it('drops rows with no value instead of printing empty ones', () => {
    const { html } = buildCustomerEmail(base)
    expect(html).toContain('Pickup')
    expect(html).not.toContain('Drop-off')
  })

  it('includes the guest notes when present and omits the block when not', () => {
    expect(buildCustomerEmail(base).html).toContain('Flight AT201')
    expect(buildCustomerEmail({ ...base, notes: '' }).html).not.toContain('Your notes')
  })

  it('never shows payment internals to the guest', () => {
    const { html, text } = buildCustomerEmail(base)
    for (const secret of ['411111', 'TX123', base.oid]) {
      expect(html).not.toContain(secret)
      expect(text).not.toContain(secret)
    }
  })

  it('escapes HTML in guest-supplied values', () => {
    const { html } = buildCustomerEmail({ ...base, notes: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('buildAdminEmail', () => {
  it('puts the money and the guest in the subject', () => {
    const { subject } = buildAdminEmail(base)
    expect(subject).toContain('PAID')
    expect(subject).toContain('1200.00 MAD')
    expect(subject).toContain('SA-F2BDC5')
  })

  it('carries the contact details and the payment ids the maison needs', () => {
    const { html, text } = buildAdminEmail(base)
    expect(html).toContain('guest@example.com')
    expect(html).toContain('+212600000000')
    expect(html).toContain(base.oid)
    expect(html).toContain('411111******1111')
    expect(text).toContain('TX123')
  })

  it('is written in English regardless of the guest language', () => {
    const { html } = buildAdminEmail({ ...base, lang: 'fr' })
    expect(html).toContain('Transfer paid')
    expect(html).toContain('Amount paid')
  })

  it('escapes HTML in guest-supplied values', () => {
    const { html } = buildAdminEmail({ ...base, customerName: '<img src=x onerror=1>' })
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img')
  })
})
