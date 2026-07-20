import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  cmiEscape,
  cmiAntiXss,
  buildHashPlaintext,
  computeHash,
  verifyHash,
  constantTimeEqual,
} from './hash'

describe('cmiEscape', () => {
  it('escapes backslash before pipe', () => {
    expect(cmiEscape('a\\b')).toBe('a\\\\b')
    expect(cmiEscape('a|b')).toBe('a\\|b')
    // backslash-then-pipe: backslash doubled first, pipe escaped second
    expect(cmiEscape('a\\|b')).toBe('a\\\\\\|b')
  })

  it('leaves ordinary and accented characters untouched', () => {
    expect(cmiEscape('José Ançé âô')).toBe('José Ançé âô')
  })
})

describe('cmiAntiXss (document rule)', () => {
  it('replaces the character immediately following "document" with a dot', () => {
    expect(cmiAntiXss('document abc')).toBe('document.abc')
    expect(cmiAntiXss('documentabc')).toBe('document.bc')
  })

  it('does nothing when "document" is absent or at end of string', () => {
    expect(cmiAntiXss('no keyword here')).toBe('no keyword here')
    expect(cmiAntiXss('ends with document')).toBe('ends with document')
  })

  it('is case-insensitive', () => {
    expect(cmiAntiXss('Documentx')).toBe('Document.')
  })
})

describe('buildHashPlaintext', () => {
  it('sorts names case-insensitively, excludes hash/encoding, appends store key', () => {
    const params = {
      clientid: '100000000',
      BillToName: 'José',
      amount: '29.95',
      oid: 'ORDER123',
      empty: '',
      hash: 'IGNORED',
      encoding: 'utf-8',
    }
    // Order: amount, BillToName, clientid, empty, oid (case-insensitive)
    expect(buildHashPlaintext(params, 'ABCD1234')).toBe(
      '29.95|José|100000000||ORDER123|ABCD1234',
    )
  })

  it('includes empty values as empty slots between separators', () => {
    // Two empty values + one non-empty => two empty slots: "" | "" | "x"
    const params = { a: '', b: '', c: 'x' }
    expect(buildHashPlaintext(params, 'K')).toBe('||x|K')
  })

  it('excludes hash and encoding case-insensitively (HASH, Encoding)', () => {
    const params = { a: '1', HASH: 'zzz', Encoding: 'utf-8', b: '2' }
    expect(buildHashPlaintext(params, 'K')).toBe('1|2|K')
  })

  it('escapes pipe and backslash in values', () => {
    // pipe: a|b -> a\|b ; backslash: c\d -> c\\d
    expect(buildHashPlaintext({ x: 'a|b', y: 'c\\d' }, 'K')).toBe(
      'a\\|b|c\\\\d|K',
    )
  })

  it('applies the document rule to values (combined with escaping)', () => {
    expect(buildHashPlaintext({ x: 'document abc' }, 'K')).toBe('document.abc|K')
    expect(buildHashPlaintext({ x: 'documentabc' }, 'K')).toBe('document.bc|K')
    // anti-XSS runs on the raw value first, so the pipe after "document" is
    // turned into "." and never survives to the escaping step.
    expect(buildHashPlaintext({ x: 'document|x' }, 'K')).toBe('document.x|K')
  })

  it('preserves accented / non-ASCII characters verbatim (CMI certification case)', () => {
    const params = {
      BillToName: 'José Ançé',
      BillToStreet1: 'Rue de l’Été, 3â',
      city: 'Marrakech',
    }
    // Order: BillToName, BillToStreet1, city
    expect(buildHashPlaintext(params, 'KÇ')).toBe(
      'José Ançé|Rue de l’Été, 3â|Marrakech|KÇ',
    )
  })

  it('trims leading/trailing whitespace from values', () => {
    expect(buildHashPlaintext({ a: '  x  ', b: '\ty\n' }, 'K')).toBe('x|y|K')
  })

  it('escapes the store key with the same backslash/pipe rules', () => {
    expect(buildHashPlaintext({ a: '1' }, 'KEY|WITH\\SPECIAL')).toBe(
      '1|KEY\\|WITH\\\\SPECIAL',
    )
  })
})

describe('computeHash', () => {
  it('equals base64(pack(H*, sha512_hex)) i.e. digest("base64") of the plaintext', () => {
    const params = { clientid: '100000000', amount: '29.95', oid: 'ORDER123' }
    const key = 'ABCD1234'
    const plaintext = buildHashPlaintext(params, key)
    const expected = createHash('sha512').update(plaintext, 'utf8').digest('base64')
    expect(computeHash(params, key)).toBe(expected)
  })

  it('produces a stable 88-char base64 SHA-512 digest', () => {
    const h = computeHash({ a: '1', b: '2' }, 'ABCD1234')
    expect(h).toHaveLength(88)
    expect(h).toMatch(/^[A-Za-z0-9+/]{86}==$/)
  })

  it('changes when the store key changes', () => {
    const params = { clientid: '100000000', amount: '29.95', oid: 'ORDER123' }
    expect(computeHash(params, 'ABCD1234')).not.toBe(computeHash(params, 'WXYZ9999'))
  })
})

describe('verifyHash / constantTimeEqual', () => {
  it('accepts a hash produced by computeHash over the same params', () => {
    const base = { clientid: '100000000', amount: '29.95', oid: 'ORDER123' }
    const hash = computeHash(base, 'ABCD1234')
    const received = { ...base, HASH: hash, encoding: 'utf-8' }
    expect(verifyHash(received, 'ABCD1234').ok).toBe(true)
  })

  it('rejects a tampered amount', () => {
    const base = { clientid: '100000000', amount: '29.95', oid: 'ORDER123' }
    const hash = computeHash(base, 'ABCD1234')
    const tampered = { ...base, amount: '2995.00', HASH: hash }
    expect(verifyHash(tampered, 'ABCD1234').ok).toBe(false)
  })

  it('rejects when the HASH param is absent', () => {
    expect(verifyHash({ a: '1' }, 'ABCD1234').ok).toBe(false)
  })

  it('constantTimeEqual is false for different-length inputs and true for identical', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false)
    expect(constantTimeEqual('abc', 'abc')).toBe(true)
    expect(constantTimeEqual('abc', 'abd')).toBe(false)
  })
})

describe('CMI PDF section 4.1.4 official worked example', () => {
  // Transcribed verbatim from the kit PDF:
  // PackageIntegrationEcomSAHAMPAY_V2.0/1.Docs/En/CmiOnlinePaymentIntegration.V2.0.pdf
  // pages 13–14 ("Example Parameters and Hash Calculation", storeKey ABCD1234).
  // Parameter names are as printed in the PDF's "Order of Used Parameters"
  // line (mixed case: TranType, okurl, storetype…) — ordering is
  // case-insensitive so the printed casing must not matter.
  const pdfParams = {
    clientid: '100200127',
    amount: '95.93',
    okurl: 'http://localhost:8080/SampleCodeJSPTest/GenericVer3ResponseHandler',
    failUrl: 'http://localhost:8080/SampleCodeJSPTest/GenericVer3ResponseHandler',
    TranType: 'PreAuth',
    email: '',
    callbackUrl: 'http://localhost:8080/SampleCodeJSPTest/GateResponseControl.jsp',
    currency: '504',
    rnd: '87954458746',
    storetype: '3d_pay_hosting',
    lang: 'en',
    hashAlgorithm: 'ver3',
    BillToName: 'name',
    BillToCompany: 'billToCompany',
  }
  const PDF_PLAINTEXT =
    '95.93|billToCompany|name|http://localhost:8080/SampleCodeJSPTest/GateResponseControl.jsp|100200127|504||http://localhost:8080/SampleCodeJSPTest/GenericVer3ResponseHandler|ver3|en|http://localhost:8080/SampleCodeJSPTest/GenericVer3ResponseHandler|87954458746|3d_pay_hosting|PreAuth|ABCD1234'

  it('reproduces the exact plaintext printed in the PDF', () => {
    expect(buildHashPlaintext(pdfParams, 'ABCD1234')).toBe(PDF_PLAINTEXT)
  })

  it('hash equals base64_encode(pack(H*, sha512(plaintext))) per the PDF formula', () => {
    const expected = createHash('sha512').update(PDF_PLAINTEXT, 'utf8').digest('base64')
    expect(computeHash(pdfParams, 'ABCD1234')).toBe(expected)
  })

  it('reproduces the PDF escaping example: ORDER-256712jbs\\j6b|', () => {
    // PDF page 13: Original value ORDER-256712jbs\j6b|
    //              Value used for hash: ORDER-256712jbs\\j6b\|
    expect(cmiEscape('ORDER-256712jbs\\j6b|')).toBe('ORDER-256712jbs\\\\j6b\\|')
  })
})
