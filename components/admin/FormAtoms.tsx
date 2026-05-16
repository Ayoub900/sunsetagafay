'use client'

import { T } from './tokens'

/* ── Field wrapper ── */
export function Field({
  label, w, full, hint, children,
}: {
  label: string; w?: string; full?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      flex: full ? '1 1 100%' : `0 0 ${w ?? 'calc(50% - 8px)'}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <label style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 500, color: T.ink2 }}>
        {label}
      </label>
      {children}
      {hint && (
        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3 }}>{hint}</span>
      )}
    </div>
  )
}

/* ── FormSection ── */
export function FormSection({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: last ? 0 : 22,
      paddingBottom: last ? 0 : 20,
      borderBottom: last ? 'none' : `1px solid ${T.line}`,
    }}>
      <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 16px' }}>{children}</div>
    </div>
  )
}

/* ── Text input ── */
export function TextInput({
  name, value, onChange, placeholder, prefix, suffix, type = 'text', required, defaultValue,
}: {
  name?: string; value?: string | number; onChange?: (v: string) => void
  placeholder?: string; prefix?: string; suffix?: string; type?: string
  required?: boolean; defaultValue?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 12px',
      background: T.surface, border: `1px solid ${T.line2}`,
      borderRadius: T.radiusSm, height: 40,
      transition: 'border-color 180ms',
    }}
    onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.sienna }}
    onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.line2 }}>
      {prefix && <span style={{ color: T.ink3, fontFamily: 'var(--sans, system-ui)', fontSize: 14, flexShrink: 0 }}>{prefix}</span>}
      <input
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        style={{
          flex: 1, background: 'transparent', border: 0, outline: 'none',
          fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink, padding: 0, minWidth: 0,
        }}
      />
      {suffix && <span style={{ color: T.ink3, fontFamily: 'var(--sans, system-ui)', fontSize: 13, flexShrink: 0 }}>{suffix}</span>}
    </div>
  )
}

/* ── Textarea ── */
export function TextArea({
  name, value, onChange, placeholder, rows = 3, required, defaultValue,
}: {
  name?: string; value?: string; onChange?: (v: string) => void
  placeholder?: string; rows?: number; required?: boolean; defaultValue?: string
}) {
  return (
    <textarea
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      rows={rows}
      required={required}
      style={{
        width: '100%', resize: 'vertical', boxSizing: 'border-box',
        background: T.surface, border: `1px solid ${T.line2}`,
        borderRadius: T.radiusSm, padding: '10px 12px',
        fontFamily: 'var(--sans, system-ui)', fontSize: 14, lineHeight: 1.55, color: T.ink, outline: 'none',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = T.sienna }}
      onBlur={e => { e.currentTarget.style.borderColor = T.line2 }}
    />
  )
}

/* ── Select ── */
export function SelectInput({
  name, value, options, onChange, defaultValue,
}: {
  name?: string; value?: string; options: string[]; onChange?: (v: string) => void; defaultValue?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 12px', background: T.surface,
      border: `1px solid ${T.line2}`, borderRadius: T.radiusSm, height: 40,
    }}>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        style={{
          flex: 1, background: 'transparent', border: 0, outline: 'none',
          fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink,
          padding: 0, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
          paddingRight: 24,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23807563' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0 center',
          backgroundSize: '12px',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

/* ── Checkbox row ── */
export function CheckboxField({
  name, label, defaultChecked,
}: {
  name: string; label: string; defaultChecked?: boolean
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink, cursor: 'pointer',
    }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} style={{ width: 16, height: 16, accentColor: T.sienna }} />
      {label}
    </label>
  )
}
