'use client'

import { useState } from 'react'

export interface EventRequestLabels {
  eyebrow: string
  title: string
  lede: string
  name: string
  email: string
  phone: string
  event_type: string
  event_date: string
  guests: string
  message: string
  submit: string
  sending: string
  submitted: string
  error_generic: string
  event_type_options: string[]
}

export default function EventRequestForm({ labels }: { labels: EventRequestLabels }) {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSending(true)

    const fd = new FormData(e.currentTarget)
    const eventType = String(fd.get('event_type') ?? '')
    const eventDate = String(fd.get('event_date') ?? '')
    const guests    = String(fd.get('guests') ?? '')
    const userMessage = String(fd.get('message') ?? '')

    const composedMessage = [
      eventType && `${labels.event_type}: ${eventType}`,
      eventDate && `${labels.event_date}: ${eventDate}`,
      guests    && `${labels.guests}: ${guests}`,
      '',
      userMessage,
    ].filter(Boolean).join('\n')

    const payload = {
      name:    String(fd.get('name') ?? ''),
      email:   String(fd.get('email') ?? ''),
      phone:   String(fd.get('phone') ?? ''),
      subject: `Private Event — ${eventType || 'General'}`,
      message: composedMessage,
      guests,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? labels.error_generic)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError(labels.error_generic)
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      id="request"
      style={{
        background: 'var(--paper-deep, var(--paper))',
        padding: 'clamp(64px,9vw,120px) var(--gutter)',
        borderTop: '1px solid rgba(31,26,20,0.14)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(36px,4vw,56px)' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 20 }}>
            {labels.eyebrow}
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(32px,4.5vw,56px)', lineHeight: 1, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
            {labels.title}
          </h2>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--sienna)', margin: 'clamp(14px,2vw,22px) 0 0' }}>
            {labels.lede}
          </p>
        </div>

        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(20px,2.4vw,28px)',
              color: 'var(--sienna)',
              lineHeight: 1.4,
              padding: 'clamp(32px,4vw,56px)',
              border: '1px solid rgba(31,26,20,0.18)',
              background: 'var(--paper)',
            }}
          >
            {labels.submitted}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px,2.5vw,28px)' }}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="event-name" className="form-label">{labels.name}</label>
                <input id="event-name" name="name" type="text" autoComplete="name" required className="form-input" />
              </div>
              <div className="form-field">
                <label htmlFor="event-email" className="form-label">{labels.email}</label>
                <input id="event-email" name="email" type="email" autoComplete="email" required className="form-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="event-phone" className="form-label">{labels.phone}</label>
                <input id="event-phone" name="phone" type="tel" autoComplete="tel" className="form-input" />
              </div>
              <div className="form-field">
                <label htmlFor="event-type" className="form-label">{labels.event_type}</label>
                <select id="event-type" name="event_type" className="form-input" defaultValue={labels.event_type_options[0]}>
                  {labels.event_type_options.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="event-date" className="form-label">{labels.event_date}</label>
                <input id="event-date" name="event_date" type="date" className="form-input" />
              </div>
              <div className="form-field">
                <label htmlFor="event-guests" className="form-label">{labels.guests}</label>
                <input id="event-guests" name="guests" type="number" min={1} max={300} className="form-input" />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="event-message" className="form-label">{labels.message}</label>
              <textarea id="event-message" name="message" rows={6} required className="form-input form-textarea" />
            </div>
            {error && (
              <div role="alert" style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--sienna)', padding: '10px 14px', background: 'rgba(160,74,42,0.08)', border: '1px solid rgba(160,74,42,0.22)', borderRadius: 4 }}>
                {error}
              </div>
            )}
            <div>
              <button type="submit" className="cta" disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
                <span className="cta-label">{sending ? labels.sending : labels.submit}</span>
                {!sending && <span className="cta-arrow" aria-hidden="true">→</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
