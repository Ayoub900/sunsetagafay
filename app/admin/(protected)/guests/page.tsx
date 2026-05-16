import Link from 'next/link'
import { getGuests, getGuestById } from '@/lib/db'
import { createGuest, updateGuest, deleteGuest } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { GuestsTable } from './GuestsTable'
import { Field, FormSection, TextInput, TextArea, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'
import type { Guest } from '@prisma/client'

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getGuests()
  const editing = params.edit ? await getGuestById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateGuest.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Guests']}
        action={!showForm ? (
          <Link href="/admin/guests?new=1" style={newBtnStyle}>+ New guest</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/guests" style={backLinkStyle}>← Back to guests</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/guests" style={cancelBtnStyle}>Cancel</Link>
              <button form="guest-form" type="submit" style={saveBtnStyle}>
                {editing ? 'Save changes' : 'Create guest'}
              </button>
            </div>
          </div>

          <PageHead
            title={editing ? editing.name : 'New guest'}
            lede={editing ? `${editing.country || 'No country'} · ${editing.stays} stay${editing.stays !== 1 ? 's' : ''} on file` : undefined}
          />

          <div style={{ padding: '8px 32px 48px' }}>
            <div style={cardStyle}>
              <form id="guest-form" action={editing ? updateWithId! : createGuest}>
                <FormSection title="Identity">
                  <Field label="Full name" full>
                    <TextInput name="name" defaultValue={editing?.name} placeholder="Anika Mehta" required />
                  </Field>
                  <Field label="Country" w="calc(50% - 8px)">
                    <TextInput name="country" defaultValue={editing?.country} placeholder="India" />
                  </Field>
                  <Field label="Stays on file" w="calc(50% - 8px)">
                    <TextInput name="stays" type="number" defaultValue={String(editing?.stays ?? 0)} />
                  </Field>
                </FormSection>
                <FormSection title="Contact">
                  <Field label="Email" w="calc(50% - 8px)">
                    <TextInput name="email" type="email" defaultValue={editing?.email} placeholder="guest@example.com" />
                  </Field>
                  <Field label="Phone" w="calc(50% - 8px)">
                    <TextInput name="phone" defaultValue={editing?.phone} placeholder="+33 6 12 34 56 78" />
                  </Field>
                </FormSection>
                <FormSection title="Notes & flags" last>
                  <Field label="Internal notes" full>
                    <TextArea name="notes" defaultValue={editing?.notes} rows={3} placeholder="Allergies, preferences, VIP context…" />
                  </Field>
                  <Field label=" " full>
                    <CheckboxField name="vip" label="VIP guest" defaultChecked={editing?.vip ?? false} />
                  </Field>
                </FormSection>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead
            title="Guests"
            lede="Past, present and registered guests. Returning guests carry their stay count."
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <GuestsTable rows={items} deleteAction={deleteGuest} />
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
