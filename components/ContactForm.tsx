'use client'

import { useState, useRef } from 'react'

interface ContactLabels {
  eyebrow: string
  title: string
  lede: string
  name_label: string
  email_label: string
  phone_label: string
  subject_label: string
  subject_reservation: string
  subject_event: string
  subject_concierge: string
  subject_other: string
  checkin_label: string
  checkout_label: string
  guests_label: string
  message_label: string
  submit: string
  sending: string
  submitted: string
  error_generic: string
  direct_eyebrow: string
  address_label: string
  directions_label: string
  directions: string[]
  address_lines: string[]
  phone: string
  email: string
  phone_label_direct: string
  email_label_direct: string
}

export default function ContactForm({ labels }: { labels: ContactLabels }) {
  const [subject, setSubject]     = useState(labels.subject_reservation)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSending(true)

    const fd = new FormData(e.currentTarget)
    const payload = {
      name:     String(fd.get('name') ?? ''),
      email:    String(fd.get('email') ?? ''),
      phone:    String(fd.get('phone') ?? ''),
      subject:  String(fd.get('subject') ?? ''),
      message:  String(fd.get('message') ?? ''),
      checkin:  String(fd.get('checkin') ?? ''),
      checkout: String(fd.get('checkout') ?? ''),
      guests:   String(fd.get('guests') ?? ''),
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
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero strip */}
      <section style={{
        paddingTop: 'calc(var(--nav-h) + clamp(48px,6vw,80px))',
        paddingBottom: 'clamp(48px,6vw,80px)',
        paddingLeft: 'var(--gutter)',
        paddingRight: 'var(--gutter)',
        background: 'var(--ink)',
        color: 'var(--paper)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 20 }}>{labels.eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(40px,6vw,72px)', lineHeight: 0.95, letterSpacing: '-0.02em', margin: 0, color: 'var(--paper)' }}>
            {labels.title}
          </h1>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,20px)', lineHeight: 1.5, color: 'rgba(242,232,213,0.7)', margin: 'clamp(16px,2vw,24px) 0 0', maxWidth: 560 }}>
            {labels.lede}
          </p>
        </div>
      </section>

      {/* Form + Direct contact */}
      <section style={{ padding: 'clamp(64px,9vw,120px) var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }} className="contact-grid">
          {/* Form */}
          <div>
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
                  background: 'var(--paper-deep)',
                }}
              >
                {labels.submitted}
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px,2.5vw,28px)' }}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="contact-name" className="form-label">{labels.name_label}</label>
                    <input id="contact-name" name="name" type="text" autoComplete="name" required className="form-input" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="contact-email" className="form-label">{labels.email_label}</label>
                    <input id="contact-email" name="email" type="email" autoComplete="email" required className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="contact-phone" className="form-label">{labels.phone_label}</label>
                    <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className="form-input" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="contact-subject" className="form-label">{labels.subject_label}</label>
                    <select
                      id="contact-subject"
                      name="subject"
                      className="form-input"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    >
                      <option>{labels.subject_reservation}</option>
                      <option>{labels.subject_event}</option>
                      <option>{labels.subject_concierge}</option>
                      <option>{labels.subject_other}</option>
                    </select>
                  </div>
                </div>
                {subject === labels.subject_reservation && (
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="contact-checkin" className="form-label">{labels.checkin_label}</label>
                      <input id="contact-checkin" name="checkin" type="date" className="form-input" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="contact-checkout" className="form-label">{labels.checkout_label}</label>
                      <input id="contact-checkout" name="checkout" type="date" className="form-input" />
                    </div>
                  </div>
                )}
                {subject === labels.subject_reservation && (
                  <div className="form-field">
                    <label htmlFor="contact-guests" className="form-label">{labels.guests_label}</label>
                    <select id="contact-guests" name="guests" className="form-input" style={{ maxWidth: 220 }}>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-field">
                  <label htmlFor="contact-message" className="form-label">{labels.message_label}</label>
                  <textarea id="contact-message" name="message" rows={6} required className="form-input form-textarea" />
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

          {/* Direct contact */}
          <aside>
            <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 32 }}>{labels.direct_eyebrow}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {labels.phone && (
                <address style={{ fontStyle: 'normal' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                    {labels.phone_label_direct}
                  </div>
                  <a href={`tel:${labels.phone.replace(/[^\d+]/g, '')}`} style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,2.8vw,32px)', color: 'var(--ink)', textDecoration: 'none' }}>
                    {labels.phone}
                  </a>
                </address>
              )}
              {labels.email && (
                <address style={{ fontStyle: 'normal' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                    {labels.email_label_direct}
                  </div>
                  <a href={`mailto:${labels.email}`} style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(17px,2vw,22px)', color: 'var(--brass)', textDecoration: 'none' }}>
                    {labels.email}
                  </a>
                </address>
              )}
              <address style={{ fontStyle: 'normal' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                  {labels.address_label}
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--sans)', fontSize: 'clamp(12px,1.3vw,13.5px)', lineHeight: 1.85, color: 'var(--ink-soft)' }}>
                  {labels.address_lines.map(l => <li key={l}>{l}</li>)}
                </ul>
              </address>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                  {labels.directions_label}
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--sans)', fontSize: 'clamp(12px,1.3vw,13.5px)', lineHeight: 1.85, color: 'var(--ink-soft)' }}>
                  {labels.directions.map(d => <li key={d}>{d}</li>)}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
