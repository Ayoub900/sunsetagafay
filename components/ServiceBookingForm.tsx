'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import PaymentLogos from '@/components/PaymentLogos'

// Booking form for the two services that are sold online but are not a stay:
// day passes and transfers. Card payment is the ONLY way to book them — there
// is no enquiry path and no "we'll hold it for you": a booking exists only once
// the guest has been sent to the payment page, and is confirmed only when CMI's
// host-to-host callback settles it.
//
// Two phases. First the guest's details are POSTed to /api/service-booking,
// which validates them, prices the booking from the DayPass / Transfer row and
// persists it. Then a native form POST hands off to /api/payment/initiate,
// which recomputes the amount server-side and returns the CMI auto-submit form.
// Nothing about the price is trusted from here — the MAD figure shown on the
// review step is the server's own answer, echoed back for confirmation.
//
// The page only renders this form for an item that has an online price; see
// each page's fallback for the (misconfigured) alternative.

export type ServiceKind = 'day-pass' | 'transfer'

export interface ServiceBookingDict {
  title_day_pass: string
  title_transfer: string
  field_date: string
  field_time_day_pass: string
  field_time_transfer: string
  field_adults: string
  field_children: string
  field_passengers: string
  field_pickup: string
  field_dropoff: string
  field_name: string
  field_email: string
  field_phone: string
  field_notes: string
  continue: string
  continue_sending: string
  error: string
  date_blocked: string
  review_title: string
  review_when: string
  review_guests: string
  review_passengers: string
  review_route: string
  review_contact: string
  edit: string
  adults_count: string
  adult_count: string
  children_count: string
  child_count: string
  passengers_count: string
  passenger_count: string
}

export interface ServicePaymentDict {
  amount_label: string
  terms_prefix: string
  terms_link: string
  pay_cta: string
  secure_note: string
  logos_note: string
  ref_label: string
}

interface Props {
  kind: ServiceKind
  slug: string
  lang: 'en' | 'fr'
  /** Localized item name, shown in the review summary. */
  itemName: string
  /** Marketing price line above the form, e.g. "€ 55". Empty to hide. */
  priceLabel: string
  fromLabel: string
  dict: ServiceBookingDict
  pay: ServicePaymentDict
}

interface Booking {
  id: string
  ref: string
  amountMadLabel: string
}

export function ServiceBookingForm({
  kind,
  slug,
  lang,
  itemName,
  priceLabel,
  fromLabel,
  dict,
  pay,
}: Props) {
  const id = useId()
  const isTransfer = kind === 'transfer'

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // 'blocked' is the admin having closed that date for this service; it needs
  // its own message because the guest can fix it by picking another date.
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'blocked'>('idle')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // Identifies the details a booking row was created from, so stepping back to
  // edit and returning unchanged reuses that row instead of creating a second,
  // orphaned one.
  const signature = JSON.stringify([date, time, adults, children, pickup, dropoff, name, email, phone, notes])
  const [bookedSignature, setBookedSignature] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setStatus('error')
      return
    }

    // Details unchanged since the row was created — go straight back to review.
    if (booking && signature === bookedSignature) {
      setStatus('idle')
      setReviewing(true)
      return
    }

    setStatus('sending')
    try {
      const r = await fetch('/api/service-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          slug,
          date,
          time,
          adults,
          children,
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          guestName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        }),
      })
      if (r.status === 409) {
        setStatus('blocked')
        return
      }
      if (!r.ok) throw new Error('bad status')
      const data = await r.json()
      setBooking({ id: data.id, ref: data.ref, amountMadLabel: data.amountMadLabel || '' })
      setBookedSignature(signature)
      setReviewing(true)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const priceRow = priceLabel ? (
    <div className="sb-price-row">
      <span className="sb-price-eyebrow">{fromLabel}</span>
      <span className="sb-price-amount">{priceLabel}</span>
    </div>
  ) : null

  // ── Review & pay ───────────────────────────────────────────────────────────
  if (reviewing && booking) {
    const countLabel = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
    const guestsLabel = [
      isTransfer
        ? countLabel(adults, dict.passenger_count, dict.passengers_count)
        : countLabel(adults, dict.adult_count, dict.adults_count),
      children > 0 ? countLabel(children, dict.child_count, dict.children_count) : '',
    ].filter(Boolean).join(' + ')

    const rows: [string, string][] = [
      [dict.review_when, [date, time].filter(Boolean).join(' · ')],
      [isTransfer ? dict.review_passengers : dict.review_guests, guestsLabel],
    ]
    if (isTransfer && (pickup || dropoff)) {
      rows.push([dict.review_route, [pickup, dropoff].filter(Boolean).join(' → ')])
    }
    rows.push([dict.review_contact, [name, email].filter(Boolean).join(' · ')])
    rows.push([pay.ref_label, booking.ref])

    return (
      <div className="sb-form">
        <Styles />
        <div className="sb-review-head">
          <div>
            <div className="sb-form-title">{dict.review_title}</div>
            <div className="sb-review-item">{itemName}</div>
          </div>
          <div className="sb-review-amount">
            <span className="sb-price-eyebrow">{pay.amount_label}</span>
            <span className="sb-review-total">{booking.amountMadLabel}</span>
          </div>
        </div>

        <dl className="sb-review-rows">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <PaymentLogos note={pay.logos_note} />

        {/* Native POST hand-off: the server re-prices and signs the CMI form. */}
        <form method="POST" action="/api/payment/initiate" className="sb-pay-form">
          <input type="hidden" name="serviceBookingId" value={booking.id} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="lang" value={lang} />

          <label htmlFor={`${id}-terms`} className="sb-terms">
            <input
              id={`${id}-terms`}
              type="checkbox"
              name="acceptTerms"
              value="true"
              required
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
            />
            <span>
              {pay.terms_prefix}{' '}
              <Link href={`/${lang}/terms`} target="_blank">{pay.terms_link}</Link>.
            </span>
          </label>

          <button type="submit" className="sb-submit" disabled={!accepted}>
            {pay.pay_cta}
            <span className="sb-submit-arrow" aria-hidden="true">→</span>
          </button>
        </form>

        <button type="button" className="sb-back" onClick={() => setReviewing(false)}>
          ← {dict.edit}
        </button>

        <p className="sb-secure-note">{pay.secure_note}</p>
      </div>
    )
  }

  // ── Details ────────────────────────────────────────────────────────────────
  const sending = status === 'sending'

  return (
    <form onSubmit={onSubmit} className="sb-form" aria-label={isTransfer ? dict.title_transfer : dict.title_day_pass}>
      <Styles />
      {priceRow}

      <h3 className="sb-form-title">{isTransfer ? dict.title_transfer : dict.title_day_pass}</h3>

      <div className="sb-row">
        <label className="sb-field">
          <span>{dict.field_date}</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        <label className="sb-field">
          <span>{isTransfer ? dict.field_time_transfer : dict.field_time_day_pass}</span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
        </label>
      </div>

      <div className="sb-row">
        <div className="sb-counter">
          <span>{isTransfer ? dict.field_passengers : dict.field_adults}</span>
          <div className="sb-counter-controls">
            <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} aria-label="-">−</button>
            <span aria-live="polite">{adults}</span>
            <button type="button" onClick={() => setAdults(Math.min(40, adults + 1))} aria-label="+">+</button>
          </div>
        </div>
        <div className="sb-counter">
          <span>{dict.field_children}</span>
          <div className="sb-counter-controls">
            <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} aria-label="-">−</button>
            <span aria-live="polite">{children}</span>
            <button type="button" onClick={() => setChildren(Math.min(40, children + 1))} aria-label="+">+</button>
          </div>
        </div>
      </div>

      {isTransfer && (
        <div className="sb-row">
          <label className="sb-field sb-field-full">
            <span>{dict.field_pickup}</span>
            <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} maxLength={300} required />
          </label>
          <label className="sb-field sb-field-full">
            <span>{dict.field_dropoff}</span>
            <input type="text" value={dropoff} onChange={e => setDropoff(e.target.value)} maxLength={300} />
          </label>
        </div>
      )}

      <div className="sb-row">
        <label className="sb-field sb-field-full">
          <span>{dict.field_name}</span>
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={100} required />
        </label>
      </div>
      <div className="sb-row">
        <label className="sb-field">
          <span>{dict.field_email}</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} required />
        </label>
        <label className="sb-field">
          <span>{dict.field_phone}</span>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" maxLength={32} />
        </label>
      </div>
      <div className="sb-row">
        <label className="sb-field sb-field-full">
          <span>{dict.field_notes}</span>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} />
        </label>
      </div>

      {status === 'error' && <p className="sb-msg sb-msg-err">{dict.error}</p>}
      {status === 'blocked' && (
        <p className="sb-msg sb-msg-err" role="alert">{dict.date_blocked}</p>
      )}

      <button type="submit" className="sb-submit" disabled={sending}>
        {sending ? dict.continue_sending : dict.continue}
        {!sending && <span className="sb-submit-arrow" aria-hidden="true">→</span>}
      </button>

      <p className="sb-secure-note">{pay.secure_note}</p>
    </form>
  )
}

// Kept next to the component so both the day-pass and the transfer page get the
// same form without either having to carry its CSS.
function Styles() {
  return (
    <style>{`
      .sb-form { background: var(--paper); border: 1px solid rgba(31,26,20,0.12); padding: clamp(24px, 3vw, 34px); margin-top: 16px; display: flex; flex-direction: column; gap: 26px; position: relative; }
      .sb-form::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, var(--brass), transparent); opacity: 0.5; }
      .sb-price-row { display: flex; flex-direction: column; gap: 4px; padding-bottom: 22px; border-bottom: 1px solid rgba(31,26,20,0.12); }
      .sb-price-eyebrow { font-family: var(--sans); font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-soft); }
      .sb-price-amount { font-family: var(--serif); font-weight: 400; font-size: clamp(28px, 3vw, 34px); letter-spacing: -0.01em; color: var(--ink); line-height: 1; }
      .sb-form-title { font-family: var(--sans); font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--sienna); margin: 0; }
      .sb-row { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(18px, 2.5vw, 28px); }
      .sb-field { display: flex; flex-direction: column; gap: 8px; }
      .sb-field-full { grid-column: 1 / -1; }
      .sb-field > span { font-family: var(--sans); font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-soft); }
      .sb-field input { font-family: var(--serif); font-style: italic; font-size: 17px; color: var(--ink); background: transparent; border: 0; border-bottom: 1px solid rgba(31,26,20,0.3); padding: 8px 0; outline: none; width: 100%; transition: border-color 300ms; -webkit-appearance: none; appearance: none; }
      .sb-field input:focus { border-color: var(--sienna); }
      .sb-field input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      .sb-field input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

      .sb-counter { display: flex; flex-direction: column; gap: 8px; }
      .sb-counter > span { font-family: var(--sans); font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-soft); }
      .sb-counter-controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(31,26,20,0.3); padding: 4px 0 8px; transition: border-color 300ms; }
      .sb-counter-controls:hover, .sb-counter-controls:focus-within { border-color: var(--sienna); }
      .sb-counter-controls button { width: 26px; height: 26px; border: 1px solid rgba(31,26,20,0.25); background: transparent; color: var(--ink); cursor: pointer; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 200ms; padding: 0; }
      .sb-counter-controls button:hover { border-color: var(--sienna); color: var(--sienna); }
      .sb-counter-controls > span { font-family: var(--serif); font-style: italic; font-size: 20px; color: var(--ink); min-width: 24px; text-align: center; }

      .sb-submit { margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 14px; padding: 18px 36px; background: var(--sienna); color: var(--paper); border: none; font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; cursor: pointer; transition: background 300ms; width: 100%; }
      .sb-submit:hover:not(:disabled) { background: var(--ink); }
      .sb-submit:disabled { background: var(--ink-soft); cursor: not-allowed; }
      .sb-submit-arrow { font-size: 14px; transition: transform 300ms; }
      .sb-submit:hover .sb-submit-arrow { transform: translateX(4px); }

      .sb-msg { font-family: var(--sans); font-size: 13px; letter-spacing: 0.02em; margin: 0; padding: 0; }
      .sb-msg-err { color: var(--sienna); }

      .sb-review-head { display: flex; flex-wrap: wrap; gap: 18px; justify-content: space-between; align-items: flex-end; padding-bottom: 22px; border-bottom: 1px solid rgba(31,26,20,0.12); }
      .sb-review-item { font-family: var(--serif); font-size: clamp(20px, 2.4vw, 26px); color: var(--ink); line-height: 1.15; margin-top: 10px; }
      .sb-review-amount { display: flex; flex-direction: column; gap: 4px; text-align: right; margin-left: auto; }
      .sb-review-total { font-family: var(--serif); font-weight: 400; font-size: clamp(24px, 2.8vw, 32px); color: var(--brass); line-height: 1; }
      .sb-review-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 18px clamp(18px, 2.5vw, 28px); margin: 0; }
      .sb-review-rows dt { font-family: var(--sans); font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6px; }
      .sb-review-rows dd { font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--ink); margin: 0; overflow-wrap: anywhere; }

      .sb-pay-form { display: flex; flex-direction: column; gap: 0; }
      .sb-terms { display: flex; align-items: flex-start; gap: 10px; font-family: var(--sans); font-size: 13px; line-height: 1.6; color: var(--ink); cursor: pointer; }
      .sb-terms input { margin-top: 3px; flex-shrink: 0; }
      .sb-terms a { color: var(--sienna); text-decoration: underline; text-underline-offset: 3px; }
      .sb-back { align-self: flex-start; background: none; border: 0; padding: 0; cursor: pointer; font-family: var(--sans); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-soft); }
      .sb-back:hover { color: var(--sienna); }
      .sb-secure-note { font-family: var(--sans); font-size: 11px; line-height: 1.7; color: var(--ink-soft); margin: 0; letter-spacing: 0.02em; }

      @media (max-width: 480px) {
        .sb-row { grid-template-columns: 1fr; gap: 22px; }
        .sb-review-rows { grid-template-columns: 1fr; }
      }
    `}</style>
  )
}
