'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/admin/icons'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import {
  Card, Cards, Chevron, Details, Empty, Notice, NoticeButton, PayCell, PayChips,
  SearchBox, Segmented, TableShell, Tile, Tiles, boardCss, td, th,
} from '@/components/admin/PaymentBoard'
import { madTotal, totalsOf, type PayState, type ReservationRow } from '@/lib/payments/view'

// The same board as Passes & Transfers, on room stays. Two differences, both
// forced by the data rather than by taste:
//
//  - A reservation can be entered by hand, so "no order" is OFFLINE ("not paid
//    online"), never an accusation of non-payment.
//  - checkIn / checkOut are free text on the model ("14 May 2026"), so there is
//    no today/upcoming/past filter here: it would have to guess at parsing.

type Tab = 'ALL' | PayState
type Status = 'ALL' | 'Pending' | 'Confirmed' | 'In-house' | 'Departing' | 'Completed' | 'Cancelled'

const tabs: { key: Tab; label: string; state?: PayState }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid', state: 'PAID' },
  { key: 'OFFLINE', label: 'Not paid online', state: 'OFFLINE' },
  { key: 'UNPAID', label: 'Not paid', state: 'UNPAID' },
  { key: 'AWAITING', label: 'Paying now', state: 'AWAITING' },
  { key: 'CHECK', label: 'Needs checking', state: 'CHECK' },
  { key: 'REFUNDED', label: 'Refunded', state: 'REFUNDED' },
  { key: 'CANCELLED', label: 'Cancelled', state: 'CANCELLED' },
]

const statuses: [Status, string][] = [
  ['ALL', 'Any status'], ['Pending', 'Pending'], ['Confirmed', 'Confirmed'],
  ['In-house', 'In-house'], ['Departing', 'Departing'], ['Completed', 'Completed'],
]

export function ReservationsBoard({ rows, deleteAction }: {
  rows: ReservationRow[]
  deleteAction: (id: string) => Promise<void>
}) {
  const [tab, setTab] = useState<Tab>('ALL')
  const [status, setStatus] = useState<Status>('ALL')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [delRow, setDelRow] = useState<ReservationRow | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const totals = useMemo(() => totalsOf(rows), [rows])
  const countFor = (t: Tab) => (t === 'ALL' ? rows.length : rows.filter(r => r.pay === t).length)

  const filtered = useMemo(() => rows.filter(r => {
    if (tab !== 'ALL' && r.pay !== tab) return false
    if (status !== 'ALL' && r.status !== status) return false
    if (query) {
      const q = query.toLowerCase()
      return [r.guestName, r.email, r.phone, r.suite, r.checkIn, r.checkOut, r.oid]
        .some(v => v.toLowerCase().includes(q))
    }
    return true
  }), [rows, tab, status, query])

  const shown = useMemo(() => totalsOf(filtered), [filtered])
  const inHouseUnpaid = rows.filter(r =>
    (r.status === 'In-house' || r.status === 'Confirmed') && (r.pay === 'UNPAID' || r.pay === 'OFFLINE'),
  ).length

  const remove = () => {
    if (!delRow) return
    startTransition(async () => {
      await deleteAction(delRow.id)
      setDelRow(null)
    })
  }

  return (
    <>
      <style>{boardCss}</style>

      <Tiles>
        <Tile
          label="Collected online" value={madTotal(totals.paidMinor)}
          foot={`${totals.paid} paid by card`}
        />
        <Tile
          label="Not paid online" value={String(totals.offline + totals.unpaid)}
          foot="Settle on site or by transfer"
          onClick={() => setTab('OFFLINE')} active={tab === 'OFFLINE'}
        />
        <Tile
          label="Paying now" value={String(totals.awaiting)} foot="Checkout opened in the last hour"
          onClick={() => setTab('AWAITING')} active={tab === 'AWAITING'}
        />
        <Tile
          label="Needs checking" value={String(totals.check + totals.attention)}
          foot="Payment and reservation disagree"
          onClick={() => setTab('CHECK')} active={tab === 'CHECK'}
        />
      </Tiles>

      {inHouseUnpaid > 0 && (
        <Notice action={<NoticeButton onClick={() => { setTab('OFFLINE'); setStatus('ALL') }}>Show them</NoticeButton>}>
          <strong>{inHouseUnpaid}</strong> confirmed or in-house {inHouseUnpaid === 1 ? 'stay has' : 'stays have'} no card payment on file.
        </Notice>
      )}

      <PayChips tabs={tabs} value={tab} onChange={setTab} countFor={countFor} />

      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search a guest, email, phone, suite, date or order id…" />
        <Segmented value={status} onChange={setStatus} options={statuses} />
      </div>

      <div style={{ marginTop: 12, fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>
        {filtered.length} {filtered.length === 1 ? 'reservation' : 'reservations'}
        {shown.paid > 0 && <> · <strong style={{ color: T.ink2 }}>{madTotal(shown.paidMinor)}</strong> collected online</>}
      </div>

      {filtered.length === 0 ? (
        <Empty>Nothing matches this filter.</Empty>
      ) : (
        <>
          <TableShell head={
            <>
              <th style={{ ...th, width: 170 }}>Payment</th>
              <th style={{ ...th, width: 130, textAlign: 'right' }}>Amount</th>
              <th style={th}>Guest</th>
              <th style={th}>Suite</th>
              <th style={{ ...th, width: 200 }}>Stay</th>
              <th style={{ ...th, width: 130 }}>Status</th>
              <th style={{ ...th, width: 96, textAlign: 'right' }}>Actions</th>
            </>
          }>
            {filtered.map(r => (
              <Row
                key={r.id} r={r}
                open={open === r.id}
                onToggle={() => setOpen(open === r.id ? null : r.id)}
                onEdit={() => router.push(`/admin/reservations?edit=${r.id}`)}
                onDelete={() => setDelRow(r)}
              />
            ))}
          </TableShell>

          <Cards>
            {filtered.map(r => (
              <Card key={r.id} state={r.pay} amount={r.amountLabel}>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.guestName}</span>
                  <StatusPill v={r.status} />
                </div>
                <div style={{ fontSize: 12.5, color: T.ink3 }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: T.ink2 }}>{r.suite} · {r.occupancy}</div>
                <div style={{ fontSize: 12.5, color: T.ink3 }}>{r.stayLabel}</div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}` }}>
                  <ReservationDetails r={r} />
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Link href={`/admin/reservations?edit=${r.id}`} style={cardBtn}>Edit</Link>
                  <button onClick={() => setDelRow(r)} style={{ ...cardBtn, color: T.sienna, cursor: 'pointer' }}>Delete</button>
                </div>
              </Card>
            ))}
          </Cards>
        </>
      )}

      {delRow && (
        <div
          onClick={() => setDelRow(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,12,8,0.45)', display: 'grid', placeItems: 'center', padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            width: 'min(480px, 92vw)', background: T.surface, border: `1px solid ${T.line2}`,
            borderRadius: T.radius, padding: 28, boxShadow: '0 20px 60px rgba(31,26,20,0.25)',
          }}>
            <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 400, fontSize: 24, lineHeight: 1.2, color: T.ink }}>
              Delete this reservation?
            </h3>
            <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 14, lineHeight: 1.6, color: T.ink2 }}>
              {delRow.guestName} · {delRow.suite} · {delRow.stayLabel}. This cannot be undone
              {delRow.pay === 'PAID' ? ', and this stay has a settled card payment against it' : ''}.
            </p>
            <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDelRow(null)} disabled={isPending} style={secondaryBtn}>Cancel</button>
              <button onClick={remove} disabled={isPending} style={primaryBtn}>{isPending ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Row({ r, open, onToggle, onEdit, onDelete }: {
  r: ReservationRow
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr className="pb-row" onClick={onToggle} style={{ borderBottom: `1px solid ${T.line}`, cursor: 'pointer' }}>
        <td style={td}><PayCell state={r.pay} note={r.paidAtLabel || r.payHint} /></td>
        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.amountLabel}</div>
          {r.quotedOnly && <div style={{ color: T.ink3, fontSize: 11.5, marginTop: 2 }}>quoted, not charged</div>}
        </td>
        <td style={td}>
          <div style={{ fontWeight: 600 }}>{r.guestName}</div>
          <div style={{ color: T.ink3, fontSize: 12 }}>{[r.email, r.phone].filter(Boolean).join(' · ') || '—'}</div>
        </td>
        <td style={td}>
          {r.suite}
          <div style={{ color: T.ink3, fontSize: 12 }}>{r.occupancy}</div>
        </td>
        <td style={td}>
          {r.stayLabel}
          <div style={{ color: T.ink3, fontSize: 12 }}>booked {r.createdAtLabel}</div>
        </td>
        <td style={td}><StatusPill v={r.status} /></td>
        <td style={{ ...td, textAlign: 'right' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <button onClick={e => { e.stopPropagation(); onEdit() }} title="Edit" style={iconBtn}>
              <Icon name="edit" size={15} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} title="Delete" style={{ ...iconBtn, color: T.sienna }}>
              <Icon name="trash" size={15} />
            </button>
            <Chevron open={open} />
          </span>
        </td>
      </tr>
      {open && (
        <tr style={{ borderBottom: `1px solid ${T.line}`, background: T.surfaceAlt }}>
          <td colSpan={7} style={{ padding: '14px 18px' }}><ReservationDetails r={r} /></td>
        </tr>
      )}
    </>
  )
}

function ReservationDetails({ r }: { r: ReservationRow }) {
  return (
    <Details
      attention={r.attention}
      facts={[
        ['Payment', r.paidAtLabel ? `Paid · ${r.paidAtLabel}` : r.payHint],
        ['Card', r.cardLabel || '—'],
        ['Order id', r.oid || 'no online payment'],
        ['Check-in', r.checkIn],
        ['Check-out', r.checkOut],
        ['Notes', r.notes || '—'],
      ]}
      footer={
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href={`/admin/reservations?edit=${r.id}`} style={{ fontSize: 12.5, fontWeight: 600, color: T.sienna, textDecoration: 'none' }}>
            Edit reservation →
          </Link>
          {r.oid && (
            <Link href="/admin/payments" style={{ fontSize: 12.5, fontWeight: 600, color: T.sienna, textDecoration: 'none' }}>
              Open in Payments →
            </Link>
          )}
        </div>
      }
    />
  )
}

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 0, borderRadius: 6, cursor: 'pointer', color: T.ink2,
}

const cardBtn: React.CSSProperties = {
  padding: '6px 12px', background: T.surface, color: T.ink, border: `1px solid ${T.line2}`,
  borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: 500,
  textDecoration: 'none', display: 'inline-block',
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px', background: T.sienna, color: '#FFF8EE', border: `1px solid ${T.sienna}`,
  borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  padding: '9px 18px', background: T.surface, color: T.ink, border: `1px solid ${T.line2}`,
  borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
}
