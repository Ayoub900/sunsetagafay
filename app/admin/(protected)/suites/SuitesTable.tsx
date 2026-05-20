'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Suite } from '@prisma/client'

interface SuiteRow extends Record<string, unknown> {
  id: string
  nameEn: string
  nameFr: string
  area: string
  view: string
  rate: string
  status: 'Active' | 'Draft'
}

interface Props {
  rows: Suite[]
  deleteAction: (id: string) => Promise<void>
}

const columns: Column<SuiteRow>[] = [
  {
    key: 'nameEn', label: 'Suite', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.nameEn}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.view}</div>
      </div>
    ),
  },
  { key: 'area',  label: 'Area',  w: '90px' },
  { key: 'rate',  label: 'Rate / night', w: '130px', sortable: true, render: r => <span style={{ fontWeight: 600 }}>{r.rate}</span> },
  {
    key: 'status', label: 'Status', w: '120px',
    render: r => <StatusPill v={r.status} />,
  },
]

export function SuitesTable({ rows, deleteAction }: Props) {
  const mapped: SuiteRow[] = rows.map(s => ({
    id: s.id,
    nameEn: s.nameEn,
    nameFr: s.nameFr,
    area: s.area,
    view: s.view,
    rate: s.rate,
    status: s.active ? 'Active' : 'Draft',
  }))

  return (
    <AdminTable<SuiteRow>
      rows={mapped}
      columns={columns}
      filterOptions={['Active', 'Draft']}
      filterKey="status"
      searchKeys={['nameEn', 'nameFr', 'view']}
      onEdit={r => { window.location.href = `/admin/suites?edit=${r.id}` }}
      deleteAction={deleteAction}
      emptyText="No suites yet — add the first one."
    />
  )
}
