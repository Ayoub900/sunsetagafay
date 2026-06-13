'use client'

import { useState, useId } from 'react'
import Link from 'next/link'
import { minCheckInDate } from '@/lib/opening'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReserveDict {
  step_dates: string
  step_suites: string
  step_details: string
  step_confirmed: string
  dates_title: string
  checkin_label: string
  checkout_label: string
  guests_label: string
  guest_singular: string
  guest_plural: string
  search_cta: string
  searching: string
  suites_title: string
  suites_sub_one: string
  suites_sub_many: string
  no_availability: string
  no_availability_sub: string
  change_dates: string
  night: string
  nights: string
  from_night: string
  area_label: string
  view_label: string
  select_cta: string
  details_title: string
  details_sub: string
  name_label: string
  email_label: string
  phone_label: string
  country_label: string
  notes_label: string
  notes_placeholder: string
  summary_label: string
  total_label: string
  confirm_cta: string
  confirming: string
  change_room: string
  confirmed_eyebrow: string
  confirmed_title: string
  confirmed_sub: string
  ref_label: string
  confirmed_suite_label: string
  confirmed_dates_label: string
  confirmed_guests_label: string
  confirmed_total_label: string
  confirmed_cta: string
  error_dates: string
  error_name: string
  error_email: string
  error_generic: string
}

interface AvailableSuite {
  id: string
  slug: string
  nameEn: string
  nameFr: string
  briefEn: string
  briefFr: string
  area: string
  view: string
  rate: string
  rateNum: number
  total: string
  imageKind: string
  imageUrl: string
}

interface DateState {
  checkIn: string
  checkOut: string
  guests: number
  nights: number
}

interface GuestForm {
  guestName: string
  email: string
  phone: string
  country: string
  notes: string
}

type Step = 'dates' | 'suites' | 'details' | 'confirmed'

interface Props {
  dict: ReserveDict
  lang: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function calcTotal(rateNum: number, nights: number) {
  if (!rateNum || !nights) return ''
  const sym = '€'
  return `${sym}${(rateNum * nights).toLocaleString()}`
}

// Gradient backgrounds matching the Photo component kinds
const kindGradients: Record<string, string> = {
  sunset:    'radial-gradient(ellipse 60% 50% at 50% 78%, rgba(255,210,150,0.55) 0%, rgba(255,170,100,0) 60%), linear-gradient(to bottom, #2b2a4a 0%, #4b3458 18%, #8b4a4a 38%, #c97b5c 58%, #e0a574 72%, #c66f3e 86%, #5a2818 100%)',
  palms:     'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(40,20,10,0.7), transparent 70%), linear-gradient(to bottom, #c97b5c 0%, #d9a98e 35%, #e8c19c 60%, #b87555 88%, #5a2a18 100%)',
  pool:      'linear-gradient(to bottom, #d9a98e 0%, #e8c8a8 22%, #c9b59a 36%, #5a8a8a 38%, #4a7a82 60%, #2e5a68 78%, #1a3a48 100%)',
  courtyard: 'radial-gradient(ellipse 70% 40% at 50% 30%, rgba(250,220,170,0.5), transparent 70%), linear-gradient(to bottom, #b87555 0%, #c97b5c 25%, #a04a2a 55%, #6a2c18 85%, #3a1a10 100%)',
  aperitif:  'radial-gradient(circle at 30% 30%, rgba(255,200,140,0.55), transparent 60%), linear-gradient(135deg, #2b2a4a 0%, #5a3858 35%, #a04a2a 70%, #c97b5c 100%)',
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS: Step[] = ['dates', 'suites', 'details', 'confirmed']

function StepBar({ step, dict }: { step: Step; dict: ReserveDict }) {
  const labels: Record<Step, string> = {
    dates: dict.step_dates,
    suites: dict.step_suites,
    details: dict.step_details,
    confirmed: dict.step_confirmed,
  }
  const current = STEPS.indexOf(step)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 'clamp(40px,6vw,72px)' }}>
      {STEPS.map((s, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `1px solid ${active ? 'var(--sienna)' : done ? 'var(--brass)' : 'rgba(31,26,20,0.2)'}`,
                background: done ? 'var(--brass)' : active ? 'var(--sienna)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600,
                color: done || active ? 'var(--paper)' : 'rgba(31,26,20,0.4)',
                letterSpacing: '0.02em',
                transition: 'all 350ms',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: active ? 'var(--sienna)' : done ? 'var(--brass)' : 'rgba(31,26,20,0.4)',
                whiteSpace: 'nowrap',
              }}>
                {labels[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '0 8px',
                marginBottom: 28,
                background: done ? 'var(--brass)' : 'rgba(31,26,20,0.15)',
                transition: 'background 350ms',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Date Step ─────────────────────────────────────────────────────────────────

function DateStep({
  dict,
  onSearch,
  loading,
  error,
}: {
  dict: ReserveDict
  onSearch: (d: DateState) => void
  loading: boolean
  error: string | null
}) {
  const id = useId()
  const today      = new Date().toISOString().split('T')[0]
  // Earliest bookable check-in: today, or the suites' opening date if it hasn't passed yet.
  const earliest   = minCheckInDate(today)
  const dayAfter   = new Date(new Date(earliest + 'T12:00:00').getTime() + 86_400_000).toISOString().split('T')[0]
  const [checkIn, setCheckIn]   = useState(earliest)
  const [checkOut, setCheckOut] = useState(dayAfter)
  const [guests, setGuests]     = useState(2)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const minCheckout = checkIn
    ? new Date(new Date(checkIn + 'T12:00:00').getTime() + 86_400_000).toISOString().split('T')[0]
    : earliest

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalErr(null)
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setLocalErr(dict.error_dates)
      return
    }
    const nights = Math.round(
      (new Date(checkOut + 'T12:00:00').getTime() - new Date(checkIn + 'T12:00:00').getTime()) / 86_400_000,
    )
    onSearch({ checkIn, checkOut, guests, nights })
  }

  const err = localErr || error

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 style={{
        fontFamily: 'var(--serif)', fontWeight: 400,
        fontSize: 'clamp(28px,3.5vw,44px)',
        letterSpacing: '-0.015em', lineHeight: 1,
        color: 'var(--ink)', margin: '0 0 clamp(32px,4vw,48px)',
      }}>
        {dict.dates_title}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'clamp(16px,2.5vw,28px)',
        marginBottom: 'clamp(24px,3vw,36px)',
      }}>
        {/* Check-in */}
        <div className="form-field">
          <label htmlFor={`${id}-checkin`}>{dict.checkin_label}</label>
          <input
            id={`${id}-checkin`}
            type="date"
            className="form-input"
            required
            min={earliest}
            value={checkIn}
            onChange={e => {
              setCheckIn(e.target.value)
              if (checkOut && e.target.value >= checkOut) setCheckOut('')
            }}
          />
        </div>

        {/* Check-out */}
        <div className="form-field">
          <label htmlFor={`${id}-checkout`}>{dict.checkout_label}</label>
          <input
            id={`${id}-checkout`}
            type="date"
            className="form-input"
            required
            min={minCheckout}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
          />
        </div>

        {/* Guests */}
        <div className="form-field">
          <label htmlFor={`${id}-guests`}>{dict.guests_label}</label>
          <select
            id={`${id}-guests`}
            className="form-select"
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>
                {n} {n === 1 ? dict.guest_singular : dict.guest_plural}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--sienna)',
          margin: '0 0 24px', letterSpacing: '0.02em',
        }}>
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.28em', textTransform: 'uppercase',
          color: 'var(--paper)',
          background: loading ? 'var(--ink-soft)' : 'var(--sienna)',
          border: 'none',
          padding: '18px 36px',
          cursor: loading ? 'default' : 'pointer',
          transition: 'background 300ms, transform 200ms',
          minWidth: 220,
          justifyContent: 'center',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)' }}
        onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sienna)' }}
      >
        {loading ? dict.searching : dict.search_cta}
        {!loading && <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>}
      </button>
    </form>
  )
}

// ── Suite Card ────────────────────────────────────────────────────────────────

function SuiteCard({
  suite,
  nights,
  isFr,
  dict,
  onSelect,
}: {
  suite: AvailableSuite
  nights: number
  isFr: boolean
  dict: ReserveDict
  onSelect: () => void
}) {
  const name  = isFr ? suite.nameFr : suite.nameEn
  const brief = isFr ? suite.briefFr : suite.briefEn
  const total = calcTotal(suite.rateNum, nights)

  return (
    <article style={{
      background: 'var(--paper)',
      border: '1px solid rgba(31,26,20,0.12)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Photo — real image when available, gradient fallback otherwise */}
      <div style={{
        aspectRatio: '3/2',
        background: kindGradients[suite.imageKind] ?? kindGradients.sunset,
        position: 'relative',
        flexShrink: 0,
      }}>
        {suite.imageUrl && (
          <img
            src={suite.imageUrl}
            alt={name}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {/* Grain */}
        <div className="grain" style={{ opacity: 0.45, mixBlendMode: 'overlay' }} aria-hidden="true" />
      </div>

      {/* Content */}
      <div style={{ padding: 'clamp(20px,2.5vw,28px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontFamily: 'var(--serif)', fontWeight: 400,
          fontSize: 'clamp(22px,2.5vw,30px)',
          letterSpacing: '-0.01em', lineHeight: 1,
          color: 'var(--ink)', margin: '0 0 12px',
        }}>
          {name}
        </h3>
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(12px,1.2vw,13px)',
          lineHeight: 1.7,
          color: 'var(--ink-soft)',
          margin: '0 0 20px',
          flex: 1,
        }}>
          {brief}
        </p>

        {/* Specs row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 16, paddingTop: 16,
          borderTop: '1px solid rgba(31,26,20,0.12)',
          marginBottom: 20,
        }}>
          {[
            [dict.area_label, suite.area],
            [dict.view_label, suite.view],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>{k}</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Rate + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 4 }}>
              {dict.from_night}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(18px,2vw,22px)', color: 'var(--brass)' }}>
              {suite.rate}
            </div>
            {total && (
              <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'rgba(31,26,20,0.55)', marginTop: 2, letterSpacing: '0.04em' }}>
                {total} · {nights} {nights === 1 ? dict.night : dict.nights}
              </div>
            )}
          </div>
          <button type="button" onClick={onSelect} className="cta" style={{ color: 'var(--sienna)' }}>
            <span className="cta-label">{dict.select_cta}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Suites Step ───────────────────────────────────────────────────────────────

function SuitesStep({
  suites,
  dates,
  isFr,
  dict,
  onSelect,
  onBack,
}: {
  suites: AvailableSuite[]
  dates: DateState
  isFr: boolean
  dict: ReserveDict
  onSelect: (s: AvailableSuite) => void
  onBack: () => void
}) {
  const datesLabel = `${formatDate(dates.checkIn, isFr ? 'fr' : 'en')} → ${formatDate(dates.checkOut, isFr ? 'fr' : 'en')} · ${dates.nights} ${dates.nights === 1 ? dict.night : dict.nights}`

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 'clamp(28px,4vw,44px)' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 400,
            fontSize: 'clamp(28px,3.5vw,44px)',
            letterSpacing: '-0.015em', lineHeight: 1,
            color: 'var(--ink)', margin: '0 0 10px',
          }}>
            {dict.suites_title}
          </h2>
          <p style={{
            fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.06em',
            color: 'var(--ink-soft)', margin: 0,
          }}>
            {datesLabel}
            {suites.length > 0 && (
              <> · <span style={{ color: 'var(--brass)' }}>
                {suites.length} {suites.length === 1 ? dict.suites_sub_one : dict.suites_sub_many}
              </span></>
            )}
          </p>
        </div>
        <button type="button" onClick={onBack} className="cta" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>
          <span className="cta-label">{dict.change_dates}</span>
        </button>
      </div>

      {suites.length === 0 ? (
        <div style={{ padding: 'clamp(48px,6vw,80px) 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(20px,2.5vw,28px)', color: 'var(--ink)', margin: '0 0 12px' }}>
            {dict.no_availability}
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 32px' }}>
            {dict.no_availability_sub}
          </p>
          <button type="button" onClick={onBack} className="cta" style={{ color: 'var(--sienna)' }}>
            <span className="cta-label">{dict.change_dates}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 'clamp(20px,3vw,36px)',
        }}>
          {suites.map(suite => (
            <SuiteCard
              key={suite.id}
              suite={suite}
              nights={dates.nights}
              isFr={isFr}
              dict={dict}
              onSelect={() => onSelect(suite)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Details Step ──────────────────────────────────────────────────────────────

function DetailsStep({
  suite,
  dates,
  isFr,
  dict,
  onConfirm,
  onBack,
  loading,
  error,
}: {
  suite: AvailableSuite
  dates: DateState
  isFr: boolean
  dict: ReserveDict
  onConfirm: (g: GuestForm) => void
  onBack: () => void
  loading: boolean
  error: string | null
}) {
  const id = useId()
  const [form, setForm] = useState<GuestForm>({ guestName: '', email: '', phone: '', country: '', notes: '' })
  const [localErr, setLocalErr] = useState<string | null>(null)

  const suiteName = isFr ? suite.nameFr : suite.nameEn
  const total     = calcTotal(suite.rateNum, dates.nights)
  const datesLabel = `${formatDate(dates.checkIn, isFr ? 'fr' : 'en')} → ${formatDate(dates.checkOut, isFr ? 'fr' : 'en')}`

  function handleChange(field: keyof GuestForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalErr(null)
    if (!form.guestName.trim()) { setLocalErr(dict.error_name); return }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(form.email)) { setLocalErr(dict.error_email); return }
    onConfirm(form)
  }

  const err = localErr || error

  return (
    <div>
      {/* Selection summary */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        padding: 'clamp(20px,2.5vw,28px)',
        marginBottom: 'clamp(32px,4vw,48px)',
        display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 6 }}>
            {dict.summary_label}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(18px,2vw,22px)', fontWeight: 400, marginBottom: 4 }}>
            {suiteName}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.06em', color: 'rgba(242,232,213,0.65)' }}>
            {datesLabel} · {dates.nights} {dates.nights === 1 ? dict.night : dict.nights} · {dates.guests} {dates.guests === 1 ? dict.guest_singular : dict.guest_plural}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {total && (
            <>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 4 }}>
                {dict.total_label}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,2.5vw,26px)', color: 'var(--brass)' }}>
                {total}
              </div>
            </>
          )}
          <button type="button" onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(242,232,213,0.55)', marginTop: 8, padding: 0,
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            {dict.change_room}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <h2 style={{
          fontFamily: 'var(--serif)', fontWeight: 400,
          fontSize: 'clamp(28px,3.5vw,44px)',
          letterSpacing: '-0.015em', lineHeight: 1,
          color: 'var(--ink)', margin: '0 0 8px',
        }}>
          {dict.details_title}
        </h2>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 clamp(28px,4vw,40px)', letterSpacing: '0.03em' }}>
          {dict.details_sub}
        </p>

        <div className="form-grid" style={{ marginBottom: 'clamp(20px,2.5vw,28px)' }}>
          <div className="form-field">
            <label htmlFor={`${id}-name`}>{dict.name_label} *</label>
            <input id={`${id}-name`} type="text" className="form-input" required autoComplete="name" value={form.guestName} onChange={handleChange('guestName')} />
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-email`}>{dict.email_label} *</label>
            <input id={`${id}-email`} type="email" className="form-input" required autoComplete="email" value={form.email} onChange={handleChange('email')} />
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-phone`}>{dict.phone_label}</label>
            <input id={`${id}-phone`} type="tel" className="form-input" autoComplete="tel" value={form.phone} onChange={handleChange('phone')} />
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-country`}>{dict.country_label}</label>
            <input id={`${id}-country`} type="text" className="form-input" autoComplete="country-name" value={form.country} onChange={handleChange('country')} />
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 'clamp(28px,4vw,40px)' }}>
          <label htmlFor={`${id}-notes`}>{dict.notes_label}</label>
          <textarea id={`${id}-notes`} className="form-textarea" placeholder={dict.notes_placeholder} value={form.notes} onChange={handleChange('notes')} />
        </div>

        {err && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--sienna)', margin: '0 0 24px', letterSpacing: '0.02em' }}>
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--paper)',
            background: loading ? 'var(--ink-soft)' : 'var(--sienna)',
            border: 'none',
            padding: '18px 36px',
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 300ms',
            minWidth: 220,
            justifyContent: 'center',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)' }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sienna)' }}
        >
          {loading ? dict.confirming : dict.confirm_cta}
          {!loading && <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>}
        </button>
      </form>
    </div>
  )
}

// ── Confirmed Step ────────────────────────────────────────────────────────────

function ConfirmedStep({
  bookingRef,
  suite,
  dates,
  isFr,
  dict,
  lang,
}: {
  bookingRef: string
  suite: AvailableSuite
  dates: DateState
  isFr: boolean
  dict: ReserveDict
  lang: string
}) {
  const suiteName  = isFr ? suite.nameFr : suite.nameEn
  const total      = calcTotal(suite.rateNum, dates.nights)
  const datesLabel = `${formatDate(dates.checkIn, isFr ? 'fr' : 'en')} → ${formatDate(dates.checkOut, isFr ? 'fr' : 'en')}`

  return (
    <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto', padding: 'clamp(16px,2vw,24px) 0 clamp(48px,6vw,80px)' }}>
      {/* Sunburst mark */}
      <svg width="40" height="40" viewBox="0 0 40 40" stroke="var(--brass)" strokeWidth={1} strokeLinecap="round" fill="none" aria-hidden="true" style={{ marginBottom: 28 }}>
        <circle cx="20" cy="20" r="3.4" />
        {Array.from({ length: 16 }, (_, i) => {
          const a  = (i / 16) * Math.PI * 2 - Math.PI / 2
          const x1 = 20 + Math.cos(a) * 7.2
          const y1 = 20 + Math.sin(a) * 7.2
          const x2 = 20 + Math.cos(a) * 18.4
          const y2 = 20 + Math.sin(a) * 18.4
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </svg>

      <div className="eyebrow" style={{ color: 'var(--sienna)', marginBottom: 20, justifyContent: 'center' }}>
        {dict.confirmed_eyebrow}
      </div>
      <h2 style={{
        fontFamily: 'var(--serif)', fontWeight: 400,
        fontSize: 'clamp(32px,5vw,60px)',
        letterSpacing: '-0.02em', lineHeight: 0.95,
        color: 'var(--ink)', margin: '0 0 24px',
      }}>
        {dict.confirmed_title}
      </h2>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.8, color: 'var(--ink-soft)', margin: '0 0 40px', letterSpacing: '0.03em' }}>
        {dict.confirmed_sub}
      </p>

      {/* Reference badge */}
      <div style={{
        display: 'inline-block',
        border: '1px solid var(--brass)',
        padding: '14px 32px',
        marginBottom: 40,
      }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
          {dict.ref_label}
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px,2.5vw,26px)', letterSpacing: '0.06em', color: 'var(--ink)' }}>
          {bookingRef}
        </div>
      </div>

      {/* Summary grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        background: 'rgba(31,26,20,0.12)',
        border: '1px solid rgba(31,26,20,0.12)',
        marginBottom: 48,
        textAlign: 'left',
      }}>
        {([
          [dict.confirmed_suite_label, suiteName],
          [dict.confirmed_dates_label, datesLabel],
          [dict.confirmed_guests_label, `${dates.guests} ${dates.guests === 1 ? dict.guest_singular : dict.guest_plural}`],
          ...(total ? [[dict.confirmed_total_label, total]] : []),
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ background: 'var(--paper)', padding: 'clamp(14px,2vw,20px) clamp(16px,2vw,24px)' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
              {k}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.5vw,17px)', color: 'var(--ink)' }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      <Link href={`/${lang}`} className="cta" style={{ color: 'var(--ink)' }}>
        <span className="cta-label">{dict.confirmed_cta}</span>
        <span className="cta-arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

export default function ReservationWizard({ dict, lang }: Props) {
  const isFr = lang === 'fr'

  const [step, setStep]         = useState<Step>('dates')
  const [dates, setDates]       = useState<DateState | null>(null)
  const [suites, setSuites]     = useState<AvailableSuite[]>([])
  const [selected, setSelected] = useState<AvailableSuite | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ ref: string } | null>(null)

  async function handleSearch(d: DateState) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn: d.checkIn, checkOut: d.checkOut, guests: d.guests }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || dict.error_generic)
      setDates(d)
      setSuites(data.suites)
      setStep('suites')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.error_generic)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(guest: GuestForm) {
    if (!selected || !dates) return
    setLoading(true)
    setError(null)
    try {
      const total = calcTotal(selected.rateNum, dates.nights)
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suiteName: selected.nameEn,
          checkIn:   dates.checkIn,
          checkOut:  dates.checkOut,
          nights:    dates.nights,
          guests:    dates.guests,
          total,
          ...guest,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || dict.error_generic)
      setConfirmed({ ref: data.ref })
      setStep('confirmed')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.error_generic)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(48px,7vw,96px) var(--gutter)' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <StepBar step={step} dict={dict} />

        {step === 'dates' && (
          <DateStep dict={dict} onSearch={handleSearch} loading={loading} error={error} />
        )}

        {step === 'suites' && dates && (
          <SuitesStep
            suites={suites}
            dates={dates}
            isFr={isFr}
            dict={dict}
            onSelect={s => { setSelected(s); setError(null); setStep('details') }}
            onBack={() => { setError(null); setStep('dates') }}
          />
        )}

        {step === 'details' && selected && dates && (
          <DetailsStep
            suite={selected}
            dates={dates}
            isFr={isFr}
            dict={dict}
            onConfirm={handleConfirm}
            onBack={() => { setError(null); setStep('suites') }}
            loading={loading}
            error={error}
          />
        )}

        {step === 'confirmed' && confirmed && selected && dates && (
          <ConfirmedStep
            bookingRef={confirmed.ref}
            suite={selected}
            dates={dates}
            isFr={isFr}
            dict={dict}
            lang={lang}
          />
        )}
      </div>
    </div>
  )
}
