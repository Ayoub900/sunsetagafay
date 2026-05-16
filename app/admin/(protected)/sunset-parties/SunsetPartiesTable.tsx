'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { SunsetParty } from '@prisma/client'

const columns: Column<SunsetParty>[] = [
  {
    key: 'nameEn', label: 'Party', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.season} · {r.capacity} guests</div>
      </div>
    ),
  },
  { key: 'slug', label: 'Slug', w: '150px', render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink3 }}>{r.slug}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: SunsetParty[]
  deleteAction: (id: string) => Promise<void>
}

export function SunsetPartiesTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr', 'season', 'slug']}
      editBasePath="/admin/sunset-parties"
      deleteAction={deleteAction}
      emptyText="No sunset parties yet."
    />
  )
}
