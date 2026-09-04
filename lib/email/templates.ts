// The two emails sent when a payment settles: one to the guest, one to the
// maison. Plain table-based HTML with inline styles (the only thing mail
// clients agree on) plus a text/plain alternative for every message.
//
// Pure string building, kept free of Prisma and `server-only` so the rendered
// output can be unit-tested (and previewed) in isolation — same convention as
// lib/cmi/pricing.ts. Secrets live in the client and assembly modules instead.

const BRAND = {
  paper: '#F2E8D5',
  ink: '#1F1A14',
  inkSoft: '#3A3026',
  sienna: '#A04A2A',
  brass: '#B8893A',
  line: 'rgba(31,26,20,0.14)',
}

export type BookingKind = 'stay' | 'day-pass' | 'transfer'

export interface PaymentEmailData {
  kind: BookingKind
  lang: 'en' | 'fr'
  /** What was bought, in the guest's language where available. */
  itemName: string
  /** Short human reference, e.g. "SA-F2BDC5". */
  reference: string
  /** CMI merchant order id, for reconciliation in the Merchant Center. */
  oid: string
  amountLabel: string
  customerName: string
  customerEmail: string
  customerPhone: string
  /** Localized booking rows shown to the guest ("When", "Guests", "Route"…). */
  rows: [string, string][]
  /** Extra operational rows for the maison only (card, transaction ids…). */
  adminRows: [string, string][]
  notes: string
  siteUrl: string
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const COPY = {
  en: {
    kind: { 'stay': 'Stay', 'day-pass': 'Day pass', 'transfer': 'Transfer' },
    eyebrow: 'Payment received',
    heading: {
      'stay': 'Your stay is confirmed.',
      'day-pass': 'Your day pass is confirmed.',
      'transfer': 'Your transfer is confirmed.',
    },
    intro:
      'Thank you — we have received your payment and your booking is confirmed. Keep this email as your receipt; the reference below is all we need to find you.',
    amount: 'Amount paid',
    reference: 'Reference',
    booked: 'What you booked',
    notes: 'Your notes',
    closing:
      'If anything about your booking needs to change, reply to this email and the maison will take care of it.',
    signoff: 'Sunset Agafay · Agafay Desert, Marrakech',
    footer: 'You are receiving this because a booking was paid for with this email address.',
  },
  fr: {
    kind: { 'stay': 'Séjour', 'day-pass': 'Day pass', 'transfer': 'Transfert' },
    eyebrow: 'Paiement reçu',
    heading: {
      'stay': 'Votre séjour est confirmé.',
      'day-pass': 'Votre day pass est confirmé.',
      'transfer': 'Votre transfert est confirmé.',
    },
    intro:
      'Merci — nous avons reçu votre paiement et votre réservation est confirmée. Conservez cet e-mail comme reçu ; la référence ci-dessous nous suffit pour vous retrouver.',
    amount: 'Montant payé',
    reference: 'Référence',
    booked: 'Votre réservation',
    notes: 'Vos précisions',
    closing:
      'Si quelque chose doit être modifié, répondez simplement à cet e-mail et la maison s’en occupe.',
    signoff: 'Sunset Agafay · Désert d’Agafay, Marrakech',
    footer: 'Vous recevez cet e-mail car une réservation a été payée avec cette adresse.',
  },
} as const

function rowsHtml(rows: [string, string][]): string {
  return rows
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.inkSoft};width:38%;vertical-align:top">${escapeHtml(k)}</td>
            <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${BRAND.ink};vertical-align:top">${escapeHtml(v)}</td>
          </tr>`,
    )
    .join('')
}

function rowsText(rows: [string, string][]): string {
  return rows
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

/** Shared page chrome: cream sheet, dark header band, brass amount. */
function shell(opts: {
  preheader: string
  eyebrow: string
  heading: string
  bodyHtml: string
  footerHtml: string
}): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <div style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF8;border:1px solid ${BRAND.line}">
          <tr>
            <td style="background:${BRAND.ink};padding:34px 32px">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.brass};margin-bottom:14px">${escapeHtml(opts.eyebrow)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.15;color:${BRAND.paper}">${escapeHtml(opts.heading)}</div>
            </td>
          </tr>
          <tr><td style="padding:32px">${opts.bodyHtml}</td></tr>
          <tr>
            <td style="padding:22px 32px;border-top:1px solid ${BRAND.line};font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:${BRAND.inkSoft}">${opts.footerHtml}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

/** The guest's receipt / confirmation, in their own language. */
export function buildCustomerEmail(d: PaymentEmailData): BuiltEmail {
  const t = COPY[d.lang]
  const heading = t.heading[d.kind]
  const subject = `${t.eyebrow} · ${d.itemName} · ${d.reference}`

  const body = `
        <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:${BRAND.inkSoft}">${escapeHtml(t.intro)}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid ${BRAND.line}">
          <tr>
            <td style="padding:18px 20px">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.inkSoft};margin-bottom:6px">${escapeHtml(t.amount)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${BRAND.brass}">${escapeHtml(d.amountLabel)}</div>
            </td>
            <td style="padding:18px 20px;text-align:right">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.inkSoft};margin-bottom:6px">${escapeHtml(t.reference)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.06em;color:${BRAND.ink}">${escapeHtml(d.reference)}</div>
            </td>
          </tr>
        </table>

        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.sienna};margin-bottom:10px">${escapeHtml(t.booked)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
          ${rowsHtml([[t.kind[d.kind], d.itemName], ...d.rows])}
        </table>
        ${
          d.notes
            ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.sienna};margin-bottom:8px">${escapeHtml(t.notes)}</div>
        <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${BRAND.ink}">${escapeHtml(d.notes)}</p>`
            : ''
        }
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.75;color:${BRAND.inkSoft}">${escapeHtml(t.closing)}</p>`

  const html = shell({
    preheader: `${heading} ${t.amount}: ${d.amountLabel}`,
    eyebrow: t.eyebrow,
    heading,
    bodyHtml: body,
    footerHtml: `${escapeHtml(t.signoff)}<br /><a href="${escapeHtml(d.siteUrl)}" style="color:${BRAND.sienna}">${escapeHtml(d.siteUrl.replace(/^https?:\/\//, ''))}</a><br /><span style="color:rgba(58,48,38,0.65)">${escapeHtml(t.footer)}</span>`,
  })

  const text = [
    heading,
    '',
    t.intro,
    '',
    `${t.amount}: ${d.amountLabel}`,
    `${t.reference}: ${d.reference}`,
    '',
    t.booked.toUpperCase(),
    rowsText([[t.kind[d.kind], d.itemName], ...d.rows]),
    d.notes ? `\n${t.notes}: ${d.notes}` : '',
    '',
    t.closing,
    '',
    t.signoff,
    d.siteUrl,
  ]
    .filter(l => l !== '')
    .join('\n')

  return { subject, html, text }
}

/** The maison's copy: the same booking plus who to contact and payment ids. */
export function buildAdminEmail(d: PaymentEmailData): BuiltEmail {
  const kindLabel = COPY.en.kind[d.kind]
  const subject = `PAID · ${kindLabel} · ${d.itemName} · ${d.amountLabel} · ${d.reference}`

  const body = `
        <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:${BRAND.inkSoft}">
          A card payment has settled. The booking is confirmed in the admin — no action needed unless you want to contact the guest.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid ${BRAND.line}">
          <tr>
            <td style="padding:18px 20px">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.inkSoft};margin-bottom:6px">Amount paid</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${BRAND.brass}">${escapeHtml(d.amountLabel)}</div>
            </td>
            <td style="padding:18px 20px;text-align:right">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.inkSoft};margin-bottom:6px">Reference</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.06em;color:${BRAND.ink}">${escapeHtml(d.reference)}</div>
            </td>
          </tr>
        </table>

        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.sienna};margin-bottom:10px">Booking</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
          ${rowsHtml([[kindLabel, d.itemName], ...d.rows])}
        </table>

        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.sienna};margin-bottom:10px">Guest</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
          ${rowsHtml([
            ['Name', d.customerName],
            ['Email', d.customerEmail],
            ['Phone', d.customerPhone],
            ['Language', d.lang.toUpperCase()],
            ['Notes', d.notes],
          ])}
        </table>

        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.sienna};margin-bottom:10px">Payment</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rowsHtml([['CMI order id', d.oid], ...d.adminRows])}
        </table>`

  const html = shell({
    preheader: `${d.amountLabel} · ${d.customerName} · ${d.itemName}`,
    eyebrow: 'Paid booking',
    heading: `${kindLabel} paid — ${d.customerName}`,
    bodyHtml: body,
    footerHtml: `Sent by the Sunset Agafay booking system · <a href="${escapeHtml(d.siteUrl)}/admin/payments" style="color:${BRAND.sienna}">Admin → Payments</a>`,
  })

  const text = [
    `${kindLabel} PAID — ${d.customerName}`,
    '',
    `Amount paid: ${d.amountLabel}`,
    `Reference: ${d.reference}`,
    '',
    'BOOKING',
    rowsText([[kindLabel, d.itemName], ...d.rows]),
    '',
    'GUEST',
    rowsText([
      ['Name', d.customerName],
      ['Email', d.customerEmail],
      ['Phone', d.customerPhone],
      ['Language', d.lang.toUpperCase()],
      ['Notes', d.notes],
    ]),
    '',
    'PAYMENT',
    rowsText([['CMI order id', d.oid], ...d.adminRows]),
  ]
    .filter(l => l !== '')
    .join('\n')

  return { subject, html, text }
}
