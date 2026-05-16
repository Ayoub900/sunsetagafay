'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Treatment } from '@prisma/client'

const columns: Column<Treatment>[] = [
  {
    key: 'nameEn', label: 'Treatment', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.nameFr}</div>
      </div>
    ),
  },
  { key: 'duration', label: 'Duration', w: '120px' },
  { key: 'price', label: 'Price', w: '100px', render: r => <span style={{ fontWeight: 600 }}>{r.price}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: Treatment[]
  deleteAction: (id: string) => Promise<void>
}

export function TreatmentsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr']}
      editBasePath="/admin/treatments"
      deleteAction={deleteAction}
      emptyText="No treatments yet."
    />
  )
}
