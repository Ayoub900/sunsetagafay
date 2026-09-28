'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import type { Popup } from '@prisma/client'

const frequencyLabel: Record<string, string> = {
  once: 'Once per visitor',
  daily: 'Once a day',
  session: 'Once per session',
}

function windowLabel(r: Popup) {
  if (!r.startDate && !r.endDate) return 'Always'
  return `${r.startDate || '…'} → ${r.endDate || '…'}`
}

const columns: Column<Popup>[] = [
  {
    key: 'name', label: 'Popup', sortable: true,
    render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {r.imageUrl
          ? <img src={r.imageUrl} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          : <span style={{ width: 48, height: 36, borderRadius: 4, background: T.surfaceAlt, flexShrink: 0 }} />}
        <div>
          <div style={{ fontWeight: 600, color: T.ink }}>{r.name}</div>
          <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{r.titleEn}</div>
        </div>
      </div>
    ),
  },
  { key: 'startDate', label: 'Runs', w: '200px', render: r => <span style={{ fontSize: 12.5, color: T.ink2 }}>{windowLabel(r)}</span> },
  { key: 'frequency', label: 'Frequency', w: '150px', render: r => <span style={{ fontSize: 12.5, color: T.ink2 }}>{frequencyLabel[r.frequency] ?? r.frequency}</span> },
  { key: 'showOn', label: 'Pages', w: '110px', render: r => <span style={{ fontSize: 12.5, color: T.ink2 }}>{r.showOn === 'home' ? 'Homepage' : 'All pages'}</span> },
  { key: 'active', label: 'Status', w: '120px', render: r => <StatusPill v={r.active ? 'Active' : 'Draft'} /> },
]

interface Props {
  rows: Popup[]
  deleteAction: (id: string) => Promise<void>
}

export function PopupsTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['name', 'titleEn', 'titleFr']}
      editBasePath="/admin/popups"
      deleteAction={deleteAction}
      emptyText="No popups yet."
    />
  )
}
