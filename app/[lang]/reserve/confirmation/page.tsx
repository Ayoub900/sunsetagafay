import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { GrainOverlay } from '@/components/shared'
import { getOrderByOid } from '@/lib/cmi/orders'
import { formatMinorUnits } from '@/lib/cmi/util'
import { bookingReference } from '@/lib/email/payment'

// Confirmation reflects the authoritative order status in the DB, never the
// (unverified) browser return data.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { robots: { index: false, follow: false } }

function Sunburst() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" stroke="var(--brass)" strokeWidth={1} strokeLinecap="round" fill="none" aria-hidden="true" style={{ marginBottom: 28 }}>
      <circle cx="20" cy="20" r="3.4" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2
        return <line key={i} x1={20 + Math.cos(a) * 7.2} y1={20 + Math.sin(a) * 7.2} x2={20 + Math.cos(a) * 18.4} y2={20 + Math.sin(a) * 18.4} />
      })}
    </svg>
  )
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ oid?: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const { oid } = await searchParams

  const dict = await getDictionary(lang as Locale)
  const p = dict.payment

  const order = oid ? await getOrderByOid(String(oid)) : null
  const paid = order?.status === 'PAID'
  // A day pass / transfer is not a stay, so the confirmed copy differs.
  const isService = !!order?.serviceBookingId

  const eyebrow = !order ? p.not_found_title : paid ? p.confirm_eyebrow : p.pending_eyebrow
  const title = !order
    ? p.not_found_title
    : paid
      ? (isService ? p.confirm_title_service : p.confirm_title)
      : p.pending_title
  const sub = !order
    ? p.not_found_sub
    : paid
      ? (isService ? p.confirm_sub_service : p.confirm_sub)
      : p.pending_sub

  const rows: [string, string][] = []
  if (order) {
    // The booking's own reference — the same one shown while booking and in the
    // confirmation email, so the guest only ever sees one number.
    const bookingId = order.reservationId ?? order.serviceBookingId
    rows.push([p.ref_label, bookingId ? bookingReference(bookingId) : `SA-${order.oid.slice(-8)}`])
    if (order.description) rows.push([p.summary_label, order.description])
    if (paid) {
      rows.push([p.amount_paid_label, `${formatMinorUnits(order.amount)} MAD`])
      if (order.maskedPan) rows.push([p.card_label, order.maskedPan])
    }
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{ position: 'relative', background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(72px,9vw,120px) var(--gutter) clamp(40px,5vw,64px)', overflow: 'hidden' }}>
        <GrainOverlay opacity={0.14} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div className="eyebrow no-lead" style={{ color: paid ? 'var(--rose)' : 'var(--brass)', marginBottom: 20 }}>
            {eyebrow}
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(34px,6vw,72px)', lineHeight: 0.98, letterSpacing: '-0.02em', margin: 0, color: 'var(--paper)' }}>
            {title}
          </h1>
        </div>
      </section>

      <div style={{ padding: 'clamp(40px,6vw,80px) var(--gutter)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          {paid && <Sunburst />}
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)', margin: '0 auto 40px', maxWidth: 520, letterSpacing: '0.02em' }}>
            {sub}
          </p>

          {rows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1px', background: 'rgba(31,26,20,0.12)', border: '1px solid rgba(31,26,20,0.12)', marginBottom: 44, textAlign: 'left' }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ background: 'var(--paper)', padding: 'clamp(14px,2vw,20px) clamp(16px,2vw,24px)' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.6vw,18px)', color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          <Link href={`/${lang}`} className="cta" style={{ color: 'var(--ink)' }}>
            <span className="cta-label">{p.back_home}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
