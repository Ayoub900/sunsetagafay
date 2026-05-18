'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { DayPass } from '@prisma/client'

const columns: Column<DayPass>[] = [
  {
    key: 'nameEn', label: 'Day pass', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>
          {r.currency || '€'} {r.price || '—'}{r.hours ? ` · ${r.hours}` : ''}
        </div>
      </div>
    ),
  },
  { key: 'slug', label: 'Slug', w: '180px', render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink3 }}>{r.slug}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: DayPass[]
  deleteAction: (id: string) => Promise<void>
}

export function DayPassesTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr', 'slug']}
      editBasePath="/admin/day-passes"
      deleteAction={deleteAction}
      emptyText="No day passes yet."
    />
  )
}
