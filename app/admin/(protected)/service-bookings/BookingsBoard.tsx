'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { T } from '@/components/admin/tokens'
import {
  Card, Cards, Chevron, DayPicker, Details, Empty, Notice, NoticeButton, PayCell, PayChips,
  SearchBox, Segmented, TableShell, Tile, Tiles, boardCss, td, th,
} from '@/components/admin/PaymentBoard'
import { useBusinessToday } from '@/components/admin/useBusinessToday'
import { dayBucket, dayLabel, type DayBucket } from '@/lib/dates'
import { madTotal, totalsOf, type BookingRow, type PayState } from '@/lib/payments/view'

// The one question this screen exists to answer, for every row, without having
// to read a second column: did this guest pay?

type Tab = 'ALL' | PayState
type Kind = 'ALL' | 'DAY_PASS' | 'TRANSFER'
type When = 'ALL' | DayBucket

const whenOptions: [When, string][] = [
  ['ALL', 'Any date'], ['TODAY', 'Today'], ['UPCOMING', 'Upcoming'], ['PAST', 'Past'],
]

const tabs: { key: Tab; label: string; state?: PayState }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid', state: 'PAID' },
  { key: 'UNPAID', label: 'Not paid', state: 'UNPAID' },
  { key: 'AWAITING', label: 'Paying now', state: 'AWAITING' },
  { key: 'CHECK', label: 'Needs checking', state: 'CHECK' },
  { key: 'REFUNDED', label: 'Refunded', state: 'REFUNDED' },
  { key: 'CANCELLED', label: 'Cancelled', state: 'CANCELLED' },
]

export function BookingsBoard({ rows, today: initialToday }: { rows: BookingRow[]; today: string }) {
  // The page's date to start with, the browser's from then on, so a board left
  // open overnight does not keep filtering on yesterday.
  const today = useBusinessToday(initialToday)
  const [tab, setTab] = useState<Tab>('ALL')
  const [kind, setKind] = useState<Kind>('ALL')
  const [when, setWhen] = useState<When>('ALL')
  // One picked day, or null. It and `when` are two ways of saying which dates
  // to show, so setting one clears the other rather than intersecting them.
  const [day, setDay] = useState<string | null>(null)
  const pickWhen = (w: When) => { setWhen(w); setDay(null) }
  const pickDay = (d: string | null) => { setDay(d); if (d) setWhen('ALL') }
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const totals = useMemo(() => totalsOf(rows), [rows])
  const countFor = (t: Tab) => (t === 'ALL' ? rows.length : rows.filter(r => r.pay === t).length)
  const countWhen = (w: When) =>
    w === 'ALL' ? rows.length : rows.filter(r => dayBucket(r.date, today) === w).length

  const filtered = useMemo(() => rows.filter(r => {
    if (tab !== 'ALL' && r.pay !== tab) return false
    if (kind !== 'ALL' && r.kind !== kind) return false
    if (when !== 'ALL' && dayBucket(r.date, today) !== when) return false
    if (day && r.date !== day) return false
    if (query) {
      const q = query.toLowerCase()
      return [r.guestName, r.email, r.phone, r.itemName, r.date, r.route, r.oid]
        .some(v => v.toLowerCase().includes(q))
    }
    return true
  }), [rows, tab, kind, when, day, query, today])

  const shown = useMemo(() => totalsOf(filtered), [filtered])
  const unpaidToday = rows.filter(r => r.date === today && (r.pay === 'UNPAID' || r.pay === 'AWAITING')).length

  return (
    <>
      <style>{boardCss}</style>

      {/* Money first: what came in, and what is still outstanding. */}
      <Tiles>
        <Tile
          label="Collected" value={madTotal(totals.paidMinor)}
          foot={`${totals.paid} paid booking${totals.paid === 1 ? '' : 's'}`}
        />
        <Tile
          label="Not paid" value={String(totals.unpaid)} foot="Left before paying"
          onClick={() => setTab('UNPAID')} active={tab === 'UNPAID'}
        />
        <Tile
          label="Paying now" value={String(totals.awaiting)} foot="Checkout opened in the last hour"
          onClick={() => setTab('AWAITING')} active={tab === 'AWAITING'}
        />
        <Tile
          label="Needs checking" value={String(totals.check + totals.attention)}
          foot="Payment and booking disagree"
          onClick={() => setTab('CHECK')} active={tab === 'CHECK'}
        />
      </Tiles>

      {unpaidToday > 0 && (
        <Notice action={<NoticeButton onClick={() => { pickWhen('TODAY'); setTab('UNPAID'); setKind('ALL') }}>Show them</NoticeButton>}>
          <strong>{unpaidToday}</strong> booking{unpaidToday === 1 ? '' : 's'} arriving today {unpaidToday === 1 ? 'has' : 'have'} not paid.
        </Notice>
      )}

      <PayChips tabs={tabs} value={tab} onChange={setTab} countFor={countFor} />

      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search a guest, email, phone, date or order id…" />
        <Segmented
          value={kind} onChange={setKind}
          options={[['ALL', 'All services'], ['DAY_PASS', 'Day passes'], ['TRANSFER', 'Transfers']]}
        />
        <Segmented value={day ? null : when} onChange={pickWhen} options={whenOptions} countFor={countWhen} />
        <DayPicker value={day} onChange={pickDay} today={today} />
      </div>

      <div style={{ marginTop: 12, fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>
        {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
        {day && <> on <strong style={{ color: T.ink2 }}>{dayLabel(day)}</strong></>}
        {shown.paid > 0 && <> · <strong style={{ color: T.ink2 }}>{madTotal(shown.paidMinor)}</strong> collected</>}
      </div>

      {filtered.length === 0 ? (
        <Empty>Nothing matches this filter.</Empty>
      ) : (
        <>
          <TableShell head={
            <>
              <th style={{ ...th, width: 160 }}>Payment</th>
              <th style={{ ...th, width: 130, textAlign: 'right' }}>Amount</th>
              <th style={th}>Guest</th>
              <th style={th}>Service</th>
              <th style={{ ...th, width: 180 }}>When</th>
              <th style={{ ...th, width: 40 }} />
            </>
          }>
            {filtered.map(r => (
              <Row key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
            ))}
          </TableShell>

          <Cards>
            {filtered.map(r => (
              <Card key={r.id} state={r.pay} amount={r.amountLabel}>
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: T.ink }}>{r.guestName}</div>
                <div style={{ fontSize: 12.5, color: T.ink3 }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: T.ink2 }}>{r.itemName} · {r.people}</div>
                <div style={{ fontSize: 12.5, color: T.ink3 }}>{r.whenLabel}</div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}` }}>
                  <BookingDetails r={r} />
                </div>
              </Card>
            ))}
          </Cards>
        </>
      )}
    </>
  )
}

function Row({ r, open, onToggle }: { r: BookingRow; open: boolean; onToggle: () => void }) {
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
          <div style={{ color: T.ink3, fontSize: 12 }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
        </td>
        <td style={td}>
          {r.itemName}
          <div style={{ color: T.ink3, fontSize: 12 }}>{r.kindLabel} · {r.people}</div>
        </td>
        <td style={td}>
          {r.whenLabel}
          <div style={{ color: T.ink3, fontSize: 12 }}>booked {r.createdAtLabel}</div>
        </td>
        <td style={td}><Chevron open={open} /></td>
      </tr>
      {open && (
        <tr style={{ borderBottom: `1px solid ${T.line}`, background: T.surfaceAlt }}>
          <td colSpan={6} style={{ padding: '14px 18px' }}><BookingDetails r={r} /></td>
        </tr>
      )}
    </>
  )
}

function BookingDetails({ r }: { r: BookingRow }) {
  return (
    <Details
      attention={r.attention}
      facts={[
        ['Payment', r.paidAtLabel ? `Paid · ${r.paidAtLabel}` : r.payHint],
        ['Card', r.cardLabel || '—'],
        ['Order id', r.oid || 'no payment started'],
        ['Booking status', r.bookingStatus],
        ['Route', r.route || '—'],
        ['Notes', r.notes || '—'],
      ]}
      footer={r.oid ? (
        <Link href="/admin/payments" style={{ fontSize: 12.5, fontWeight: 600, color: T.sienna, textDecoration: 'none' }}>
          Open in Payments →
        </Link>
      ) : undefined}
    />
  )
}
