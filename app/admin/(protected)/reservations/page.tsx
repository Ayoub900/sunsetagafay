import Link from 'next/link'
import { getReservations, getReservationById } from '@/lib/db'
import { createReservation, updateReservation, deleteReservation } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { ReservationsTable } from './ReservationsTable'
import { StatusPill } from '@/components/admin/Pill'
import { Field, FormSection, TextInput, TextArea, SelectInput } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'
import type { Reservation } from '@prisma/client'

const statusOptions = ['Pending', 'Confirmed', 'In-house', 'Departing', 'Completed', 'Cancelled']

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getReservations()
  const editing = params.edit ? await getReservationById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateReservation.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Reservations']}
        action={!showForm ? (
          <Link href="/admin/reservations?new=1" style={newBtnStyle}>+ New reservation</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/reservations" style={backLinkStyle}>← Back to reservations</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/reservations" style={cancelBtnStyle}>Cancel</Link>
              <button form="reservation-form" type="submit" style={saveBtnStyle}>
                {editing ? 'Save changes' : 'Create reservation'}
              </button>
            </div>
          </div>

          <PageHead
            title={editing ? `Reservation — ${editing.guestName}` : 'New reservation'}
            lede={editing ? `${editing.suite} · ${editing.checkIn} → ${editing.checkOut} · ${editing.nights} nights` : undefined}
          />

          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={cardStyle}>
                <form id="reservation-form" action={editing ? updateWithId! : createReservation}>
                  <FormSection title="Guest & Room">
                    <Field label="Guest name" full>
                      <TextInput name="guestName" defaultValue={editing?.guestName} placeholder="Anika Mehta" required />
                    </Field>
                    <Field label="Suite / room" full>
                      <TextInput name="suite" defaultValue={editing?.suite} placeholder="Chambre Atlas" required />
                    </Field>
                  </FormSection>
                  <FormSection title="Dates">
                    <Field label="Check-in" w="calc(50% - 8px)">
                      <TextInput name="checkIn" defaultValue={editing?.checkIn} placeholder="14 May 2026" required />
                    </Field>
                    <Field label="Check-out" w="calc(50% - 8px)">
                      <TextInput name="checkOut" defaultValue={editing?.checkOut} placeholder="18 May 2026" required />
                    </Field>
                    <Field label="Nights" w="160px">
                      <TextInput name="nights" type="number" defaultValue={String(editing?.nights ?? 1)} required />
                    </Field>
                    <Field label="Guests" w="160px">
                      <TextInput name="guests" type="number" defaultValue={String(editing?.guests ?? 1)} required />
                    </Field>
                  </FormSection>
                  <FormSection title="Financials & Status">
                    <Field label="Total" w="calc(50% - 8px)">
                      <TextInput name="total" defaultValue={editing?.total} placeholder="€2,400" />
                    </Field>
                    <Field label="Status" w="calc(50% - 8px)">
                      <SelectInput name="status" defaultValue={editing?.status ?? 'Pending'} options={statusOptions} />
                    </Field>
                  </FormSection>
                  <FormSection title="Notes" last>
                    <Field label="Internal notes" full>
                      <TextArea name="notes" defaultValue={editing?.notes} rows={3} placeholder="VIP notes, dietary requirements, special requests…" />
                    </Field>
                  </FormSection>
                </form>
              </div>

              {/* Sidebar summary */}
              {editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>Summary</h3>
                    <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        ['Guest', editing.guestName],
                        ['Suite', editing.suite],
                        ['Check-in', editing.checkIn],
                        ['Check-out', editing.checkOut],
                        ['Nights', String(editing.nights)],
                        ['Guests', String(editing.guests)],
                        ['Total', editing.total || '—'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: `1px solid ${T.line}` }}>
                          <dt style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>{k}</dt>
                          <dd style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 500, color: T.ink }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div style={{ marginTop: 14 }}>
                      <StatusPill v={editing.status} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead
            title="Reservations"
            lede="All bookings on file. Filter by status or search by guest name."
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <ReservationsTable rows={items} deleteAction={deleteReservation} />
          </div>
        </>
      )}
    </>
  )
}

const newBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', height: 36, background: T.sienna, color: '#FFF8EE', border: `1px solid ${T.sienna}`, borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }
const backBarStyle: React.CSSProperties = { padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.line}`, background: T.surface }
const backLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, color: T.ink2, textDecoration: 'none' }
const cancelBtnStyle: React.CSSProperties = { padding: '8px 14px', background: T.surface, color: T.ink, border: `1px solid ${T.line2}`, borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, textDecoration: 'none', display: 'inline-block' }
const saveBtnStyle: React.CSSProperties = { padding: '8px 18px', background: T.sienna, color: '#FFF8EE', border: 'none', borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }
