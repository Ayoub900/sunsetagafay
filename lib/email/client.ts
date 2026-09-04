import 'server-only'
import { Resend } from 'resend'

// Transactional email via Resend. Every send is best-effort by design: it is
// called after a payment has already been taken and the HTTP response to CMI
// has been sent, so a mailer outage must never surface as a payment error.
// Failures are logged (and are visible in the Resend dashboard), never thrown.

export interface EmailConfig {
  apiKey: string
  /** Verified sender, e.g. "Sunset Agafay <reservations@sunsetagafay.com>". */
  from: string
  /** Where booking notifications for the maison go. */
  adminTo: string
  /** Reply-To on guest mail so answers reach the maison, not the sender box. */
  replyTo: string
}

const DEFAULT_ADMIN = 'info@sunsetagafay.com'

/**
 * Read the mail configuration, or null when email is not configured. Returning
 * null (rather than throwing, as the CMI config does) keeps local development
 * and preview deployments working without a Resend key.
 */
export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return null

  // The from address must be on a domain verified in Resend, otherwise Resend
  // rejects the send.
  const from = process.env.EMAIL_FROM?.trim() || `Sunset Agafay <${DEFAULT_ADMIN}>`
  const adminTo = process.env.EMAIL_ADMIN_TO?.trim() || DEFAULT_ADMIN
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || adminTo

  return { apiKey, from, adminTo, replyTo }
}

let client: Resend | null = null

function getClient(apiKey: string): Resend {
  if (!client) client = new Resend(apiKey)
  return client
}

export interface SendArgs {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Label used in logs so a failure can be traced to what it was. */
  tag: string
}

export interface SendResult {
  sent: boolean
  id?: string
  error?: string
  /** True when email is simply not configured — expected in dev, not an error. */
  skipped?: boolean
}

/** Send one email. Never throws. */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const cfg = getEmailConfig()
  if (!cfg) {
    console.warn(`[email][skipped] ${args.tag} -> ${args.to} (RESEND_API_KEY not set)`)
    return { sent: false, skipped: true }
  }
  if (!args.to.trim()) return { sent: false, error: 'no recipient' }

  try {
    const { data, error } = await getClient(cfg.apiKey).emails.send({
      from: cfg.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo ?? cfg.replyTo,
    })
    if (error) {
      console.error(`[email][failed] ${args.tag} -> ${args.to}`, error.message ?? String(error))
      return { sent: false, error: error.message ?? String(error) }
    }
    console.info(`[email][sent] ${args.tag} -> ${args.to} id=${data?.id ?? '?'}`)
    return { sent: true, id: data?.id }
  } catch (err) {
    console.error(`[email][failed] ${args.tag} -> ${args.to}`, String(err))
    return { sent: false, error: String(err) }
  }
}
