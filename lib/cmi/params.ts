import 'server-only'
import type { Order } from '@prisma/client'
import { computeHash, type HashParams } from './hash'
import { getCmiConfig, cmiUrls, type CmiConfig } from './config'
import { formatMinorUnits, newRnd, toCmiLang } from './util'

// Builds the exact field set POSTed to the CMI Hosted Payment Page. Every value
// is trimmed once here so the bytes hashed are byte-identical to the bytes
// posted. The resulting object is both hashed and rendered into the form.

export type CmiFields = Record<string, string>

export function buildInitiateFields(order: Order, cfg: CmiConfig = getCmiConfig()): CmiFields {
  const urls = cmiUrls(cfg)

  // Order matters only for readability; the hash sorts names itself.
  const fields: CmiFields = {
    clientid: cfg.clientId,
    storetype: '3d_pay_hosting',
    trantype: 'PreAuth',
    amount: formatMinorUnits(order.amount),
    currency: order.currency || cfg.currency, // "504" = MAD
    oid: order.oid,
    okUrl: urls.okUrl,
    failUrl: urls.failUrl,
    callbackUrl: urls.callbackUrl,
    shopurl: urls.shopUrl,
    CallbackResponse: 'true',
    lang: toCmiLang(order.lang),
    email: order.customerEmail,
    BillToName: order.customerName,
    rnd: newRnd(),
    hashAlgorithm: 'ver3',
    encoding: 'utf-8',
    // Maximum allowed by the PDF (30–2700s) so 3-D Secure step-up doesn't expire.
    sessiontimeout: '2700',
    // Send the customer straight back to okUrl on success instead of waiting
    // for them to click the return link (reduces abandoned-tab reconciliation).
    AutoRedirect: 'true',
  }

  if (order.customerPhone && order.customerPhone.trim()) {
    fields.tel = order.customerPhone.trim()
  }

  // If a foreign currency is displayed on the site (e.g. EUR), send it for
  // display while `amount` stays the MAD value CMI settles.
  if (
    order.displayAmount != null &&
    order.displayCurrency &&
    order.displayCurrency !== fields.currency
  ) {
    fields.amountCur = formatMinorUnits(order.displayAmount)
    if (order.displaySymbol) fields.symbolCur = order.displaySymbol
  }

  // Trim every value; then compute the hash over the trimmed set.
  for (const k of Object.keys(fields)) fields[k] = String(fields[k]).trim()

  fields.hash = computeHash(fields as HashParams, cfg.storeKey)
  return fields
}
