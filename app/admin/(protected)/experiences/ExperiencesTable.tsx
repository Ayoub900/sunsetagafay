'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Experience } from '@prisma/client'

const columns: Column<Experience>[] = [
  {
    key: 'nameEn', label: 'Experience', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.when} · {r.who}</div>
      </div>
    ),
  },
  { key: 'n', label: 'No.', w: '80px', render: r => <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink3 }}>{r.n}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: Experience[]
  deleteAction: (id: string) => Promise<void>
}

export function ExperiencesTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr', 'when', 'who']}
      editBasePath="/admin/experiences"
      deleteAction={deleteAction}
      emptyText="No experiences yet."
    />
  )
}
