import { getOrders, getOrdersNeedingAttention } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { T } from '@/components/admin/tokens'
import { formatMinorUnits } from '@/lib/cmi/util'
import type { Order } from '@prisma/client'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, { bg: string; fg: string }> = {
  PAID: { bg: '#e7f2ea', fg: '#1f6b3b' },
  PENDING: { bg: '#fdf3e2', fg: '#8a5a12' },
  UNDER_RECONCILIATION: { bg: '#fbe8e4', fg: '#9a3412' },
  CANCELLED: { bg: '#eee', fg: '#555' },
  REFUNDED: { bg: '#eef', fg: '#3b3b8a' },
  PARTIALLY_REFUNDED: { bg: '#eef', fg: '#3b3b8a' },
}

function StatusChip({ v }: { v: string }) {
  const c = statusColors[v] ?? { bg: '#eee', fg: '#555' }
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: c.bg, color: c.fg, fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {v.replace(/_/g, ' ')}
    </span>
  )
}

function fmt(d: Date) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Row({ o }: { o: Order }) {
  return (
    <tr style={{ borderBottom: `1px solid ${T.line}` }}>
      <td style={td}><code style={{ fontSize: 12 }}>{o.oid}</code></td>
      <td style={td}>{o.customerName}<div style={{ color: T.ink3, fontSize: 12 }}>{o.customerEmail}</div></td>
      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{formatMinorUnits(o.amount)} MAD</td>
      <td style={td}><StatusChip v={o.status} /></td>
      <td style={td}>{o.cmiStatus ?? '—'}</td>
      <td style={{ ...td, color: T.ink3, fontSize: 12 }}>{fmt(o.createdAt)}</td>
    </tr>
  )
}

function Table({ rows, empty }: { rows: Order[]; empty: string }) {
  if (rows.length === 0) {
    return <p style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink3, padding: '16px 0' }}>{empty}</p>
  }
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${T.line}`, borderRadius: T.radius, background: T.surface }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sans, system-ui)' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.line}`, textAlign: 'left' }}>
            {['Order (oid)', 'Customer', 'Amount', 'Status', 'CMI', 'Created'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(o => <Row key={o.id} o={o} />)}</tbody>
      </table>
    </div>
  )
}

export default async function PaymentsPage() {
  const [attention, all] = await Promise.all([getOrdersNeedingAttention(), getOrders()])

  return (
    <>
      <AdminTopbar crumbs={['Operations', 'Payments']} />
      <PageHead
        title="Payments"
        lede="CMI order status. Orders needing attention should be verified against the CMI Merchant Center. Payment status is set by the host-to-host callback, not this screen."
      />
      <div style={{ padding: '8px 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <section>
          <h2 style={sectionTitle}>Needs attention <span style={{ color: T.ink3, fontWeight: 400 }}>({attention.length})</span></h2>
          <Table rows={attention} empty="Nothing to reconcile. All orders are settled or freshly pending." />
        </section>
        <section>
          <h2 style={sectionTitle}>Recent orders</h2>
          <Table rows={all} empty="No orders yet." />
        </section>
      </div>
    </>
  )
}

const th: React.CSSProperties = { padding: '12px 14px', fontSize: 12, fontWeight: 600, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13.5, color: T.ink, verticalAlign: 'top' }
const sectionTitle: React.CSSProperties = { fontFamily: 'var(--sans, system-ui)', fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 12px' }
