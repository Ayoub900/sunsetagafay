'use client'

import { useState } from 'react'

interface Props {
  slug: string
  passNameEn: string
  passNameFr: string
  lang: 'en' | 'fr'
  dict: {
    form_title: string
    field_start_date: string
    field_start_time: string
    field_adults: string
    field_children: string
    submit: string
    submit_sending: string
    submit_done: string
    submit_error: string
  }
  currency: string
  price: string
}

export function DayPassBookingForm({ slug, passNameEn, passNameFr, lang, dict, currency, price }: Props) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const subject = `Day Pass — ${lang === 'fr' ? passNameFr : passNameEn}`
      const message = [
        `Day Pass: ${passNameEn} (${slug})`,
        `Date: ${date || '—'}`,
        `Time: ${time || '—'}`,
        `Adults: ${adults}`,
        `Children: ${children}`,
        phone ? `Phone: ${phone}` : '',
      ].filter(Boolean).join('\n')
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message,
          checkin: date,
          checkout: '',
          guests: String(adults + children),
        }),
      })
      if (!r.ok) throw new Error('bad status')
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const priceLabel = price ? `${currency || '€'} ${price}` : ''

  const fromLabel = lang === 'fr' ? 'À partir de' : 'From'

  if (status === 'done') {
    return (
      <div className="dp-form" role="status" aria-live="polite">
        {priceLabel && (
          <div className="dp-price-row">
            <span className="dp-price-eyebrow">{fromLabel}</span>
            <span className="dp-price-amount">{priceLabel}</span>
          </div>
        )}
        <p className="dp-msg dp-msg-ok">{dict.submit_done}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="dp-form" aria-label={dict.form_title}>
      {priceLabel && (
        <div className="dp-price-row">
          <span className="dp-price-eyebrow">{fromLabel}</span>
          <span className="dp-price-amount">{priceLabel}</span>
        </div>
      )}

      <h3 className="dp-form-title">{dict.form_title}</h3>

      <div className="dp-row">
        <label className="dp-field">
          <span>{dict.field_start_date}</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        <label className="dp-field">
          <span>{dict.field_start_time}</span>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="dp-row">
        <div className="dp-counter">
          <span>{dict.field_adults}</span>
          <div className="dp-counter-controls">
            <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} aria-label="−">−</button>
            <span aria-live="polite">{adults}</span>
            <button type="button" onClick={() => setAdults(adults + 1)} aria-label="+">+</button>
          </div>
        </div>
        <div className="dp-counter">
          <span>{dict.field_children}</span>
          <div className="dp-counter-controls">
            <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} aria-label="−">−</button>
            <span aria-live="polite">{children}</span>
            <button type="button" onClick={() => setChildren(children + 1)} aria-label="+">+</button>
          </div>
        </div>
      </div>

      <div className="dp-row">
        <label className="dp-field dp-field-full">
          <span>{lang === 'fr' ? 'Nom' : 'Name'}</span>
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
        </label>
      </div>
      <div className="dp-row">
        <label className="dp-field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="dp-field">
          <span>{lang === 'fr' ? 'Téléphone' : 'Phone'}</span>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
        </label>
      </div>

      {status === 'error' && <p className="dp-msg dp-msg-err">{dict.submit_error}</p>}

      <button type="submit" className="dp-submit" disabled={status === 'sending'}>
        {status === 'sending' ? dict.submit_sending : dict.submit}
        {status !== 'sending' && <span className="dp-submit-arrow" aria-hidden="true">→</span>}
      </button>
    </form>
  )
}
