'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Restaurant } from '@prisma/client'

const columns: Column<Restaurant>[] = [
  {
    key: 'nameEn', label: 'Restaurant', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.hours}</div>
      </div>
    ),
  },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: Restaurant[]
  deleteAction: (id: string) => Promise<void>
}

export function RestaurantsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['nameEn', 'nameFr']}
      editBasePath="/admin/restaurants"
      deleteAction={deleteAction}
      emptyText="No restaurants yet."
    />
  )
}
