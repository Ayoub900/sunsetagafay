'use client'

import { PayBadge, payToneColors } from './PayBadge'
import { Icon } from './icons'
import { T } from './tokens'
import { addDays } from '@/lib/dates'
import { PAY_META, type PayState } from '@/lib/payments/view'

// The chrome shared by every "who paid?" screen — summary tiles, payment
// filter chips, search, the expandable detail grid. Passes & Transfers and
// Reservations differ only in their columns, so everything around the table
// lives here and stays identical between them.
//
// Colour discipline: only PayBadge and the chip dots carry payment colour.
// Tiles and rows use the ordinary admin surface/line tokens, and the one
// accent for "this filter is on" is T.sienna, same as the rest of the admin.

/** Shared media queries and hover. Drop into a <style> once per board. */
export const boardCss = `
  .pb-row:hover { background: rgba(160,74,42,0.035); }
  .pb-cards { display: none; }
  @media (max-width: 900px) {
    .pb-table-wrap { display: none; }
    .pb-cards { display: flex; }
    .pb-tiles { grid-template-columns: repeat(2, 1fr) !important; }
  }
  /* The money tile wraps over three lines at phone widths otherwise. */
  @media (max-width: 640px) {
    .pb-tile-value { font-size: 22px !important; }
  }
`

export const th: React.CSSProperties = {
  padding: '11px 14px', fontSize: 11.5, fontWeight: 600, color: T.ink2,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

export const td: React.CSSProperties = {
  padding: '13px 14px', fontSize: 13.5, color: T.ink, verticalAlign: 'top',
}

export function Tiles({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {children}
    </div>
  )
}

export function Tile({ label, value, foot, onClick, active }: {
  label: string
  value: string
  foot: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        background: T.surface,
        border: `1px solid ${active ? T.sienna : T.line}`,
        boxShadow: active ? `inset 0 0 0 1px ${T.sienna}` : T.shadow,
        borderRadius: T.radius, padding: '16px 18px',
        fontFamily: 'var(--sans, system-ui)',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink3 }}>{label}</div>
      <div className="pb-tile-value" style={{
        marginTop: 6, fontFamily: 'var(--serif, Georgia, serif)', fontSize: 30, lineHeight: 1.1,
        color: T.ink, letterSpacing: '-0.015em',
      }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: T.ink3 }}>{foot}</div>
    </button>
  )
}

/** A quiet call-out above the list, e.g. "3 arriving today have not paid". */
export function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: T.surfaceAlt, border: `1px solid ${T.line}`, borderRadius: T.radius,
      fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink2,
    }}>
      <span style={{ color: T.sienna, display: 'inline-flex' }}><Icon name="bell" size={16} /></span>
      <span>{children}</span>
      {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
    </div>
  )
}

export function NoticeButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: T.surface, border: `1px solid ${T.line2}`, borderRadius: T.radiusSm,
      padding: '5px 12px', cursor: 'pointer',
      fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: 600, color: T.sienna,
    }}>{children}</button>
  )
}

/**
 * Payment filter chips. They double as the tally, so there is no separate
 * count row that could drift out of sync with the list underneath.
 */
export function PayChips<Tab extends string>({ tabs, value, onChange, countFor }: {
  tabs: { key: Tab; label: string; state?: PayState }[]
  value: Tab
  onChange: (t: Tab) => void
  countFor: (t: Tab) => number
}) {
  return (
    <div style={{ marginTop: 22, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const on = value === t.key
        const dot = t.state ? payToneColors[PAY_META[t.state].tone].dot : null
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 13px', cursor: 'pointer',
            background: on ? T.ink : T.surface,
            color: on ? '#FBF8F0' : T.ink2,
            border: `1px solid ${on ? T.ink : T.line2}`, borderRadius: 999,
            fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: on ? 600 : 500,
          }}>
            {dot && <span style={{ width: 7, height: 7, borderRadius: 4, background: dot }} />}
            {t.label}
            <span style={{ opacity: on ? 0.7 : 0.55, fontVariantNumeric: 'tabular-nums' }}>{countFor(t.key)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 38,
      background: T.surface, border: `1px solid ${T.line2}`, borderRadius: T.radiusSm,
      flex: 1, minWidth: 200,
    }}>
      <span style={{ color: T.ink3, display: 'inline-flex' }}><Icon name="search" size={15} /></span>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: T.ink3, display: 'inline-flex', padding: 0 }}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}

/**
 * A narrow either/or filter. Pass `countFor` where an empty answer would
 * otherwise read as a broken filter — "Today 0" says the day is quiet, where a
 * bare "Today" showing nothing looks like the button did not work.
 *
 * `value` may be null when another control has taken over, e.g. a picked day
 * in place of Today / Upcoming / Past; then no option is shown as on.
 */
export function Segmented<V extends string>({ value, onChange, options, countFor }: {
  value: V | null; onChange: (v: V) => void; options: [V, string][]
  countFor?: (v: V) => number
}) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, background: T.surfaceAlt, borderRadius: T.radiusSm, border: `1px solid ${T.line}` }}>
      {options.map(([v, label]) => {
        const on = value === v
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', border: 0, borderRadius: T.radiusSm - 2, cursor: 'pointer',
            background: on ? T.surface : 'transparent', color: on ? T.ink : T.ink2,
            boxShadow: on ? '0 1px 2px rgba(31,26,20,0.06)' : 'none',
            fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: on ? 600 : 500,
          }}>
            {label}
            {countFor && (
              <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>{countFor(v)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Choose one calendar day. The arrows step a day at a time, starting from today
 * when nothing is picked yet, so walking through the week takes one click per
 * day. `null` means no day is picked.
 */
export function DayPicker({ value, onChange, today }: {
  value: string | null; onChange: (day: string | null) => void; today: string
}) {
  const step = (days: number) => onChange(addDays(value ?? today, value ? days : 0))
  const on = value !== null
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 3px',
      background: T.surface, borderRadius: T.radiusSm,
      border: `1px solid ${on ? T.sienna : T.line2}`,
      boxShadow: on ? `inset 0 0 0 1px ${T.sienna}` : 'none',
    }}>
      <button onClick={() => step(-1)} title="Previous day" style={dayStepBtn}>
        <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><Icon name="arrow" size={13} /></span>
      </button>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: on ? T.ink : T.ink3 }}>
        <Icon name="calendar" size={14} />
        <input
          type="date" aria-label="Pick a day" value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          style={{
            background: 'transparent', border: 0, outline: 'none', padding: 0, width: 118,
            fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: on ? 600 : 500,
            color: on ? T.ink : T.ink2,
          }}
        />
      </label>
      <button onClick={() => step(1)} title="Next day" style={dayStepBtn}>
        <Icon name="arrow" size={13} />
      </button>
      {on && (
        <button onClick={() => onChange(null)} title="Clear day" style={{ ...dayStepBtn, color: T.sienna }}>
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  )
}

const dayStepBtn: React.CSSProperties = {
  width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 0, borderRadius: 4, cursor: 'pointer', color: T.ink2, padding: 0,
}

/** The expanded panel under a row (and the body of every mobile card). */
export function Details({ facts, attention, footer }: {
  facts: [string, string][]
  attention: string | null
  footer?: React.ReactNode
}) {
  return (
    <div style={{ fontFamily: 'var(--sans, system-ui)' }}>
      {attention && (
        <div style={{
          marginBottom: 12, padding: '9px 12px', borderRadius: T.radiusSm,
          background: payToneColors.alert.bg, color: payToneColors.alert.fg, fontSize: 12.5, fontWeight: 500,
        }}>
          ⚠ {attention}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px 20px' }}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.ink3, fontWeight: 600 }}>{k}</div>
            <div style={{ fontSize: 13, color: T.ink, marginTop: 2, wordBreak: 'break-word' }}>{v}</div>
          </div>
        ))}
      </div>
      {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
    </div>
  )
}

/** The payment cell: badge plus the one line that explains it. */
export function PayCell({ state, note }: { state: PayState; note: string }) {
  return (
    <>
      <PayBadge state={state} />
      <div style={{ color: T.ink3, fontSize: 11.5, marginTop: 4 }}>{note || PAY_META[state].hint}</div>
    </>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 14, padding: '56px 24px', textAlign: 'center',
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius,
      fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink3,
    }}>{children}</div>
  )
}

export function TableShell({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="pb-table-wrap" style={{
      marginTop: 14, overflowX: 'auto',
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sans, system-ui)' }}>
        <thead>
          <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.line}`, textAlign: 'left' }}>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Cards({ children }: { children: React.ReactNode }) {
  return <div className="pb-cards" style={{ marginTop: 14, flexDirection: 'column', gap: 10 }}>{children}</div>
}

export function Card({ state, amount, children }: {
  state: PayState; amount: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: T.radius, padding: 14, fontFamily: 'var(--sans, system-ui)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <PayBadge state={state} big />
        <span style={{ fontWeight: 700, fontSize: 15, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
      </div>
      {children}
    </div>
  )
}

/** The row's chevron, rotated when its detail panel is open. */
export function Chevron({ open }: { open: boolean }) {
  return (
    <span style={{ display: 'inline-flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', color: T.ink3 }}>
      <Icon name="arrow" size={14} />
    </span>
  )
}
