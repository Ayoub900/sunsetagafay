import Link from 'next/link'
import { PayBadge, payToneColors } from './PayBadge'
import { T } from './tokens'
import { madTotal, totalsOf, type BookingRow } from '@/lib/payments/view'

// The dashboard's answer to "who paid for today's day passes and transfers?".
// It leads with today's arrivals because that is what the desk is asked at the
// gate; on a quiet day it falls back to the newest bookings so it is never a
// blank card.
//
// Like the full board, the badge is the only thing here allowed to carry
// payment colour — the panel itself stays on the neutral admin surface.

export function ServicePaymentPanel({ rows, today }: { rows: BookingRow[]; today: string }) {
  const totals = totalsOf(rows)
  const arrivingToday = rows.filter(r => r.date === today)
  const unpaidToday = arrivingToday.filter(r => r.pay === 'UNPAID' || r.pay === 'AWAITING')
  const preview = (arrivingToday.length > 0 ? arrivingToday : rows).slice(0, 5)
  const needsChecking = totals.check + totals.attention

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
        flexWrap: 'wrap', padding: '18px 20px 0',
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 15, color: T.ink }}>
            Passes &amp; transfers
          </h2>
          <p style={{ margin: '3px 0 0', fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3 }}>
            {arrivingToday.length > 0 ? 'Arriving today' : 'Latest bookings'}
          </p>
        </div>
        <Link href="/admin/service-bookings" style={{
          fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 500,
          color: T.sienna, textDecoration: 'none',
        }}>View all →</Link>
      </div>

      <div className="dash-pay-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '16px 20px',
      }}>
        <MiniStat label="Paid" tone="paid" value={String(totals.paid)} foot={`${madTotal(totals.paidMinor)} collected`} />
        <MiniStat label="Not paid" tone="unpaid" value={String(totals.unpaid + totals.awaiting)} foot="Booked but no money in" />
        <MiniStat label="Needs checking" tone="alert" value={String(needsChecking)} foot="Payment and booking disagree" />
      </div>

      {unpaidToday.length > 0 && (
        <div style={{
          margin: '0 20px 12px', padding: '10px 14px', borderRadius: T.radiusSm,
          background: T.surfaceAlt, border: `1px solid ${T.line}`,
          fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2,
        }}>
          <strong>{unpaidToday.length}</strong> arriving today {unpaidToday.length === 1 ? 'has' : 'have'} not paid — collect on site or chase the payment.
        </div>
      )}

      {preview.length === 0 ? (
        <div style={{ padding: '28px 20px 32px', textAlign: 'center', fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink3 }}>
          No day pass or transfer bookings yet.
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${T.line}` }}>
          {preview.map((r, i) => (
            <div key={r.id} className="dash-pay-row" style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto',
              alignItems: 'center', columnGap: 16, padding: '12px 20px',
              borderBottom: i < preview.length - 1 ? `1px solid ${T.line}` : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 13.5, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.guestName}
                </div>
                <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.itemName} · {r.whenLabel}
                </div>
              </div>
              <div className="dash-pay-amount" style={{
                fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 13.5, color: T.ink,
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              }}>{r.amountLabel}</div>
              <PayBadge state={r.pay} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// A dot rather than a filled block: it names which payment state the number
// counts without turning the panel into three coloured boxes.
function MiniStat({ label, value, foot, tone }: {
  label: string
  value: string
  foot: string
  tone: keyof typeof payToneColors
}) {
  return (
    <div style={{ background: T.surfaceAlt, borderRadius: T.radiusSm, padding: '12px 14px', fontFamily: 'var(--sans, system-ui)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.ink2 }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: payToneColors[tone].dot, flexShrink: 0 }} />
        {label}
      </div>
      <div style={{
        marginTop: 2, fontFamily: 'var(--serif, Georgia, serif)', fontSize: 26,
        lineHeight: 1.15, color: T.ink, letterSpacing: '-0.015em',
      }}>{value}</div>
      <div style={{ marginTop: 2, fontSize: 11.5, color: T.ink3 }}>{foot}</div>
    </div>
  )
}
