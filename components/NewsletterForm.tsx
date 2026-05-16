'use client'

import { useState } from 'react'

interface NewsletterFormProps {
  placeholder: string
  label: string
  subscribe: string
}

export function NewsletterForm({ placeholder, label, subscribe }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  return (
    <form
      onSubmit={e => { e.preventDefault(); setEmail('') }}
      style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(242,232,213,0.4)', paddingBottom: 10 }}
      aria-label={label}
    >
      <label
        htmlFor="footer-email"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {label}
      </label>
      <input
        id="footer-email"
        type="email"
        required
        placeholder={placeholder}
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', padding: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--paper)' }}
        autoComplete="email"
      />
      <button
        type="submit"
        style={{ background: 'transparent', border: 0, color: 'var(--paper)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', padding: '8px 0 8px 16px', minHeight: 44 }}
      >
        {subscribe}&nbsp;→
      </button>
    </form>
  )
}
