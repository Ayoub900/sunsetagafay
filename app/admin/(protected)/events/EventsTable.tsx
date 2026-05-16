'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Event } from '@prisma/client'

const columns: Column<Event>[] = [
  {
    key: 'nameEn', label: 'Event', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>Capacity: {r.capacity}</div>
      </div>
    ),
  },
  { key: 'slug', label: 'Slug', w: '150px', render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink3 }}>{r.slug}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: Event[]
  deleteAction: (id: string) => Promise<void>
}

export function EventsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr', 'slug']}
      editBasePath="/admin/events"
      deleteAction={deleteAction}
      emptyText="No events yet."
    />
  )
}
