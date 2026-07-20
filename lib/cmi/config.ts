import 'server-only'

// Central, server-only accessor for CMI configuration. Nothing here is ever
// exposed to the client. See CMI-PAYMENT.md for how each value is provisioned
// and, in particular, where the store key is set in the CMI back office
// (Administration -> Changer les clés du magasin).

export interface CmiConfig {
  clientId: string
  storeKey: string
  gatewayUrl: string
  baseUrl: string
  currency: string // ISO-4217 numeric — MAD = "504"
}

function required(name: string): string {
  const v = process.env[name]
  if (!v || v.trim() === '') {
    throw new Error(`Missing required CMI env var: ${name}`)
  }
  return v.trim()
}

let cached: CmiConfig | null = null

export function getCmiConfig(): CmiConfig {
  if (cached) return cached

  const clientId = required('CMI_CLIENT_ID')
  const storeKey = required('CMI_STORE_KEY')
  const gatewayUrl = required('CMI_GATEWAY_URL')

  // The public https base URL of the site. Used to build okUrl / failUrl /
  // callbackUrl / shopurl. Must be reachable from the public internet (the
  // callback in particular) even during the test phase.
  const baseUrl = required('CMI_BASE_URL').replace(/\/+$/, '')

  // CMI rejects store keys that contain the literal "SKS" (a common paste of a
  // placeholder). Fail fast rather than sign every request with a bad key.
  if (storeKey.includes('SKS')) {
    throw new Error(
      'CMI_STORE_KEY looks invalid: it must not contain "SKS". Set the real key from the CMI back office (Administration -> Changer les clés du magasin).',
    )
  }

  if (!/^https:\/\//.test(baseUrl)) {
    throw new Error('CMI_BASE_URL must be an absolute https:// URL')
  }

  cached = {
    clientId,
    storeKey,
    gatewayUrl,
    baseUrl,
    currency: '504',
  }
  return cached
}

// Best-effort public origin for building the browser-return redirects in the
// ok / fail / initiate routes. Behind a reverse proxy `req.url` resolves to the
// internal bind host (e.g. http://localhost:3001), so a customer would be sent
// to an unreachable URL after paying. Prefer the canonical CMI_BASE_URL (the
// same origin CMI itself posts back to); fall back to the request origin only
// if it is unset/malformed. Never throws — redirects must always resolve.
export function publicBaseUrl(fallbackUrl: string): string {
  const raw = process.env.CMI_BASE_URL?.trim().replace(/\/+$/, '')
  if (raw && /^https?:\/\//.test(raw)) return raw
  try {
    return new URL(fallbackUrl).origin
  } catch {
    return raw ?? ''
  }
}

// Absolute callback / return URLs derived from the base URL.
export function cmiUrls(cfg: CmiConfig) {
  return {
    okUrl: `${cfg.baseUrl}/api/payment/ok`,
    failUrl: `${cfg.baseUrl}/api/payment/fail`,
    callbackUrl: `${cfg.baseUrl}/api/payment/callback`,
    shopUrl: cfg.baseUrl,
  }
}
