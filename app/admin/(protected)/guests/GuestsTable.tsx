'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { Pill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Guest } from '@prisma/client'

const columns: Column<Guest>[] = [
  {
    key: 'avatar', label: '', w: '52px',
    render: r => (
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: r.vip ? T.brass : T.surfaceAlt,
        color: r.vip ? '#FFF8EE' : T.ink,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 13,
      }}>
        {r.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
      </div>
    ),
  },
  {
    key: 'name', label: 'Name', sortable: true,
    render: r => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600, color: T.ink }}>{r.name}</span>
        {r.vip && <Pill tone="brass" dot={false}>VIP</Pill>}
      </span>
    ),
  },
  { key: 'country', label: 'Country', w: '120px' },
  {
    key: 'email', label: 'Email',
    render: r => r.email ? (
      <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink2 }}>{r.email}</span>
    ) : <span style={{ color: T.ink3 }}>—</span>,
  },
  {
    key: 'phone', label: 'Phone', w: '160px',
    render: r => r.phone ? (
      <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, color: T.ink2 }}>{r.phone}</span>
    ) : <span style={{ color: T.ink3 }}>—</span>,
  },
  {
    key: 'stays', label: 'Stays', w: '80px', align: 'right',
    render: r => <span style={{ fontWeight: 600 }}>{r.stays}</span>,
  },
]

interface Props {
  rows: Guest[]
  deleteAction: (id: string) => Promise<void>
}

export function GuestsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['name', 'email', 'country', 'phone']}
      editBasePath="/admin/guests"
      deleteAction={deleteAction}
      emptyText="No guests yet."
    />
  )
}
