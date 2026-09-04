import Link from 'next/link'
import { getAvailabilityBlocks, getAvailabilityBlockById, getReservableServices } from '@/lib/db'
import { createBlock, updateBlock, deleteBlock } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { BlocksTable } from './BlocksTable'
import { Field, FormSection, TextInput } from '@/components/admin/FormAtoms'
import { SERVICE_TYPES } from '@/lib/services'
import { T } from '@/components/admin/tokens'

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const [items, services] = await Promise.all([getAvailabilityBlocks(), getReservableServices()])
  const editing = params.edit ? await getAvailabilityBlockById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateBlock.bind(null, editing.id) : null
  const selectedKey = editing ? `${editing.serviceType}::${editing.serviceId}` : '::'

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Blocked Dates']}
        action={!showForm ? (
          <Link href="/admin/availability?new=1" style={newBtnStyle}>+ New block</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/availability" style={backLinkStyle}>← Back to blocked dates</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/availability" style={cancelBtnStyle}>Cancel</Link>
              <button form="block-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create block'}</button>
            </div>
          </div>
          <PageHead title={editing ? 'Edit block' : 'New block'} />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={cardStyle}>
              <form id="block-form" action={editing ? updateWithId! : createBlock}>
                <FormSection title="Service">
                  <Field label="What to close" full hint="Pick one item, all of a type, or the entire property. Suites, day passes and transfers are booked online, so their blocks stop guests from booking those dates. The types marked “inquiry only” have no online booking, so a block on one is recorded here for staff but is not enforced on the site.">
                    <div style={selectWrap}>
                      <select name="serviceKey" defaultValue={selectedKey} style={selectEl}>
                        <option value="::">Entire property — everything closed</option>
                        {SERVICE_TYPES.map(st => {
                          const rows = services[st.type] ?? []
                          return (
                            <optgroup key={st.type} label={st.label + (st.enforced ? '' : ' (inquiry only)')}>
                              <option value={`${st.type}::`}>{st.allLabel}</option>
                              {rows.map(it => (
                                <option key={it.id} value={`${st.type}::${it.id}`}>{it.name}</option>
                              ))}
                            </optgroup>
                          )
                        })}
                      </select>
                    </div>
                  </Field>
                </FormSection>
                <FormSection title="Dates">
                  <Field label="From (first blocked night)" w="calc(50% - 8px)">
                    <TextInput name="startDate" type="date" defaultValue={editing?.startDate} required />
                  </Field>
                  <Field label="To (last blocked night)" w="calc(50% - 8px)" hint="Both dates are inclusive. For a one-day closure, set both to the same date.">
                    <TextInput name="endDate" type="date" defaultValue={editing?.endDate} required />
                  </Field>
                </FormSection>
                <FormSection title="Note" last>
                  <Field label="Reason (internal)" full hint="Optional. Only shown here in the admin.">
                    <TextInput name="reason" defaultValue={editing?.reason} placeholder="Maintenance, private buy-out…" />
                  </Field>
                </FormSection>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Blocked Dates" lede="Close a service — or the whole property — for a date range. Other dates stay open for booking." />
          <div style={{ padding: '8px 32px 48px' }}>
            <BlocksTable rows={items} deleteAction={deleteBlock} />
          </div>
        </>
      )}
    </>
  )
}

const selectWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0 12px',
  background: T.surface, border: `1px solid ${T.line2}`, borderRadius: T.radiusSm, height: 40,
}
const selectEl: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 0, outline: 'none',
  fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink,
  padding: 0, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: 24,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23807563' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '12px',
}

const newBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', height: 36, background: T.sienna, color: '#FFF8EE', border: `1px solid ${T.sienna}`, borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }
const backBarStyle: React.CSSProperties = { padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.line}`, background: T.surface }
const backLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, color: T.ink2, textDecoration: 'none' }
const cancelBtnStyle: React.CSSProperties = { padding: '8px 14px', background: T.surface, color: T.ink, border: `1px solid ${T.line2}`, borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, textDecoration: 'none', display: 'inline-block' }
const saveBtnStyle: React.CSSProperties = { padding: '8px 18px', background: T.sienna, color: '#FFF8EE', border: 'none', borderRadius: T.radiusSm, fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }
