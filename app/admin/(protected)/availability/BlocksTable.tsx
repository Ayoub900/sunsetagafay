'use client'

import { AdminTable, Column } from '@/components/admin/AdminTable'
import { T } from '@/components/admin/tokens'
import { serviceTypeLabel } from '@/lib/services'
import type { AvailabilityBlock } from '@prisma/client'

function fmt(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Small caption under the service name: the type, or a clear label for the
// property-wide / all-of-type closures.
function typeCaption(r: AvailabilityBlock) {
  if (!r.serviceType) return 'Entire property'
  return r.serviceId ? serviceTypeLabel(r.serviceType) : `All ${serviceTypeLabel(r.serviceType).toLowerCase()}s`
}

const columns: Column<AvailabilityBlock>[] = [
  {
    key: 'serviceName', label: 'Service', sortable: true,
    render: r => (
      <div>
        <div style={{ fontWeight: 600, color: r.serviceType ? T.ink : T.sienna }}>
          {r.serviceName || 'Entire property'}
        </div>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>{typeCaption(r)}</div>
      </div>
    ),
  },
  {
    key: 'startDate', label: 'Blocked dates', sortable: true, w: 'minmax(220px, 1fr)',
    render: r => (
      <span style={{ color: T.ink }}>
        {fmt(r.startDate)} → {fmt(r.endDate)}
      </span>
    ),
  },
  {
    key: 'reason', label: 'Reason', w: 'minmax(180px, 1fr)',
    render: r => <span style={{ color: T.ink3 }}>{r.reason || '—'}</span>,
  },
]

interface Props {
  rows: AvailabilityBlock[]
  deleteAction: (id: string) => Promise<void>
}

export function BlocksTable({ rows, deleteAction }: Props) {
  return (
    <AdminTable
      rows={rows as unknown as Record<string, unknown>[]}
      columns={columns as Column<Record<string, unknown>>[]}
      searchKeys={['serviceName', 'serviceType', 'reason', 'startDate', 'endDate']}
      editBasePath="/admin/availability"
      deleteAction={deleteAction}
      emptyText="No blocked dates. Every service is bookable on every open date."
    />
  )
}
