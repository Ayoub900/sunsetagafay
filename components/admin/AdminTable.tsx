'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { T } from './tokens'
import { Icon } from './icons'

export interface Column<T> {
  key: string
  label: string
  w?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

interface AdminTableProps<R extends Record<string, unknown>> {
  rows: R[]
  columns: Column<R>[]
  filterOptions?: string[]
  filterKey?: string
  searchKeys?: string[]
  onEdit?: (row: R) => void
  editBasePath?: string
  deleteAction?: (id: string) => Promise<void>
  rowKey?: string
  emptyText?: string
}

function ConfirmModal({ title, body, onCancel, onConfirm, loading }: {
  title: string; body: string; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(20,12,8,0.45)',
      display: 'grid', placeItems: 'center', padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(480px, 92vw)',
        background: T.surface,
        border: `1px solid ${T.line2}`,
        borderRadius: T.radius,
        padding: 28,
        boxShadow: '0 20px 60px rgba(31,26,20,0.25)',
      }}>
        <h3 style={{
          margin: '0 0 10px',
          fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 400, fontSize: 24, lineHeight: 1.2, color: T.ink,
        }}>{title}</h3>
        <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 14, lineHeight: 1.6, color: T.ink2 }}>{body}</p>
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={secondaryBtn}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={primaryBtn}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminTable<R extends Record<string, unknown>>({
  rows, columns, filterOptions, filterKey, searchKeys = [], onEdit, editBasePath, deleteAction, rowKey = 'id', emptyText = 'Nothing here yet.',
}: AdminTableProps<R>) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [delRow, setDelRow] = useState<R | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleEdit = onEdit ?? (editBasePath ? (row: R) => router.push(`${editBasePath}?edit=${row[rowKey]}`) : undefined)

  const filtered = useMemo(() => rows.filter(r => {
    if (filterKey && filter !== 'All' && r[filterKey] !== filter) return false
    if (query) {
      const q = query.toLowerCase()
      const keys = searchKeys.length ? searchKeys : Object.keys(r)
      return keys.some(k => String(r[k] ?? '').toLowerCase().includes(q))
    }
    return true
  }), [rows, filter, filterKey, query, searchKeys])

  const hasActions = !!(handleEdit || deleteAction)
  const colWidths = columns.map(c => c.w ?? 'minmax(180px, 1fr)').join(' ') + (hasActions ? ' 90px' : '')

  const handleDelete = () => {
    if (!delRow || !deleteAction) return
    startTransition(async () => {
      await deleteAction(String(delRow[rowKey]))
      setDelRow(null)
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 12px',
          background: T.surface, border: `1px solid ${T.line2}`,
          borderRadius: T.radiusSm, height: 38, flex: 1, minWidth: 160,
        }}>
          <span style={{ color: T.ink3, display: 'inline-flex' }}><Icon name="search" size={15} /></span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Filter the list…"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: T.ink3, display: 'inline-flex', padding: 0 }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {filterOptions && (
          <div style={{
            display: 'inline-flex', padding: 3,
            background: T.surfaceAlt, borderRadius: T.radiusSm, border: `1px solid ${T.line}`,
          }}>
            {(['All', ...filterOptions]).map(o => {
              const on = filter === o
              return (
                <button key={o} onClick={() => setFilter(o)} style={{
                  padding: '5px 12px',
                  background: on ? T.surface : 'transparent',
                  color: on ? T.ink : T.ink2,
                  fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: on ? 600 : 500,
                  border: 0, borderRadius: T.radiusSm - 2,
                  boxShadow: on ? '0 1px 2px rgba(31,26,20,0.06)' : 'none',
                  cursor: 'pointer', transition: 'background 180ms',
                }}>{o}</button>
              )
            })}
          </div>
        )}

        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: T.radius, boxShadow: T.shadow }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.line}`,
        borderRadius: T.radius, overflow: 'hidden', width: 'max-content', minWidth: '100%',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: colWidths,
          padding: '12px 22px',
          background: T.surfaceAlt, borderBottom: `1px solid ${T.line}`,
        }}>
          {columns.map(c => (
            <div key={c.key} style={{
              textAlign: c.align ?? 'left',
              fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600, color: T.ink2,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
            }}>
              {c.label}
              {c.sortable && <span style={{ color: T.ink3, display: 'inline-flex' }}><Icon name="sort" size={11} /></span>}
            </div>
          ))}
          {hasActions && <div style={{ textAlign: 'right', fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600, color: T.ink2 }}>Actions</div>}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '56px 22px', textAlign: 'center', fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink3 }}>
            {emptyText}
          </div>
        ) : filtered.map((r, i) => (
          <div key={String(r[rowKey])} style={{
            display: 'grid', gridTemplateColumns: colWidths,
            padding: '14px 22px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? `1px solid ${T.line}` : 'none',
            transition: 'background 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(160,74,42,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
            {columns.map(c => (
              <div key={c.key} style={{
                textAlign: c.align ?? 'left',
                fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink,
                paddingRight: 10, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {c.render ? c.render(r) : String(r[c.key] ?? '')}
              </div>
            ))}
            {hasActions && (
              <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 4 }}>
                {handleEdit && (
                  <button onClick={() => handleEdit(r)} title="Edit" style={iconBtn}>
                    <Icon name="edit" size={15} />
                  </button>
                )}
                {deleteAction && (
                  <button onClick={() => setDelRow(r)} title="Delete" style={{ ...iconBtn, color: T.sienna }}>
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      {delRow && (
        <ConfirmModal
          title="Delete this record?"
          body="This action cannot be undone."
          onCancel={() => setDelRow(null)}
          onConfirm={handleDelete}
          loading={isPending}
        />
      )}
    </>
  )
}

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 0, borderRadius: 6, cursor: 'pointer',
  color: T.ink2, transition: 'background 180ms',
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px', background: T.sienna, color: '#FFF8EE',
  border: `1px solid ${T.sienna}`, borderRadius: T.radiusSm,
  fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500,
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  padding: '9px 18px', background: T.surface, color: T.ink,
  border: `1px solid ${T.line2}`, borderRadius: T.radiusSm,
  fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500,
  cursor: 'pointer',
}
