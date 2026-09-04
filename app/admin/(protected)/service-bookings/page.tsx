import { getServiceBookings } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { T } from '@/components/admin/tokens'
import { formatMinorUnits } from '@/lib/cmi/util'
import type { Order, ServiceBooking } from '@prisma/client'

// Day pass and transfer bookings taken on the site. A booking only becomes
// Confirmed when the CMI host-to-host callback marks its order PAID, so a
// Pending row with no order is an abandoned checkout, not a sale.
export const dynamic = 'force-dynamic'

// `orders` is a list only because Order's foreign key is not itself unique;
// Order.bookingRef guarantees there is at most one.
type Row = ServiceBooking & { orders: Order[] }

const kindLabels: Record<string, string> = {
  DAY_PASS: 'Day pass',
  TRANSFER: 'Transfer',
}

const statusColors: Record<string, { bg: string; fg: string }> = {
  Confirmed: { bg: '#e7f2ea', fg: '#1f6b3b' },
  Pending: { bg: '#fdf3e2', fg: '#8a5a12' },
  Cancelled: { bg: '#eee', fg: '#555' },
}

function StatusChip({ v }: { v: string }) {
  const c = statusColors[v] ?? { bg: '#eee', fg: '#555' }
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: c.bg, color: c.fg, fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {v}
    </span>
  )
}

function fmt(d: Date) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function BookingRow({ b }: { b: Row }) {
  const order = b.orders[0] ?? null
  const people = [
    `${b.adults} ${b.kind === 'TRANSFER' ? 'pax' : 'adults'}`,
    b.children > 0 ? `${b.children} children` : '',
  ].filter(Boolean).join(' · ')

  return (
    <tr style={{ borderBottom: `1px solid ${T.line}` }}>
      <td style={td}>
        {b.itemName}
        <div style={{ color: T.ink3, fontSize: 12 }}>{kindLabels[b.kind] ?? b.kind}</div>
      </td>
      <td style={td}>
        {b.date}{b.time ? ` · ${b.time}` : ''}
        <div style={{ color: T.ink3, fontSize: 12 }}>{people}</div>
      </td>
      <td style={td}>
        {b.guestName}
        <div style={{ color: T.ink3, fontSize: 12 }}>{b.email}{b.phone ? ` · ${b.phone}` : ''}</div>
      </td>
      <td style={td}>
        {b.pickup || b.dropoff
          ? <span style={{ fontSize: 12.5 }}>{[b.pickup, b.dropoff].filter(Boolean).join(' → ')}</span>
          : '—'}
      </td>
      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>
        {order ? `${formatMinorUnits(order.amount)} MAD` : b.total || '—'}
        <div style={{ color: T.ink3, fontSize: 12 }}>{order ? order.status.replace(/_/g, ' ') : 'no payment started'}</div>
      </td>
      <td style={td}><StatusChip v={b.status} /></td>
      <td style={{ ...td, color: T.ink3, fontSize: 12 }}>{fmt(b.createdAt)}</td>
    </tr>
  )
}

export default async function ServiceBookingsPage() {
  const bookings = await getServiceBookings()
  const confirmed = bookings.filter(b => b.status === 'Confirmed')

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Passes & Transfers']} />
      <PageHead
        title="Passes & Transfers"
        lede="Day pass and transfer bookings taken on the site. A booking is confirmed only once its payment is settled by CMI — pending rows are unfinished checkouts."
      />
      <div style={{ padding: '8px 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <section>
          <h2 style={sectionTitle}>
            Confirmed <span style={{ color: T.ink3, fontWeight: 400 }}>({confirmed.length})</span>
          </h2>
          <Table rows={confirmed} empty="No paid bookings yet." />
        </section>
        <section>
          <h2 style={sectionTitle}>All bookings</h2>
          <Table rows={bookings} empty="No bookings yet. Set an online price on a day pass or transfer to start selling it." />
        </section>
      </div>
    </>
  )
}

function Table({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) {
    return <p style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink3, padding: '16px 0' }}>{empty}</p>
  }
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${T.line}`, borderRadius: T.radius, background: T.surface }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sans, system-ui)' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.line}`, textAlign: 'left' }}>
            {['Service', 'When', 'Guest', 'Route', 'Payment', 'Status', 'Booked'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(b => <BookingRow key={b.id} b={b} />)}</tbody>
      </table>
    </div>
  )
}

const th: React.CSSProperties = { padding: '12px 14px', fontSize: 12, fontWeight: 600, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13.5, color: T.ink, verticalAlign: 'top' }
const sectionTitle: React.CSSProperties = { fontFamily: 'var(--sans, system-ui)', fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 12px' }
