'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Reservation } from '@prisma/client'

const statusOptions = ['Pending', 'Confirmed', 'In-house', 'Departing', 'Completed', 'Cancelled']

const columns: Column<Reservation>[] = [
  {
    key: 'guestName', label: 'Guest', sortable: true,
    render: r => <span style={{ fontWeight: 600, color: T.ink }}>{r.guestName}</span>,
  },
  {
    key: 'suite', label: 'Suite',
    render: r => <span style={{ color: T.ink2 }}>{r.suite}</span>,
  },
  {
    key: 'checkIn', label: 'Check-in', w: '110px',
    render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5 }}>{r.checkIn}</span>,
  },
  {
    key: 'checkOut', label: 'Check-out', w: '110px',
    render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5 }}>{r.checkOut}</span>,
  },
  { key: 'nights', label: 'Nights', w: '80px', align: 'right' },
  {
    key: 'total', label: 'Total', w: '110px', align: 'right',
    render: r => r.total ? <span style={{ fontWeight: 600 }}>{r.total}</span> : <span style={{ color: T.ink3 }}>—</span>,
  },
  {
    key: 'status', label: 'Status', w: '140px',
    render: r => <StatusPill v={r.status} />,
  },
]

interface Props {
  rows: Reservation[]
  deleteAction: (id: string) => Promise<void>
}

export function ReservationsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      filterOptions={statusOptions}
      filterKey="status"
      searchKeys={['guestName', 'suite', 'checkIn', 'checkOut']}
      editBasePath="/admin/reservations"
      deleteAction={deleteAction}
      emptyText="No reservations yet — add the first one."
    />
  )
}
