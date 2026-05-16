import Link from 'next/link'
import { getTreatments, getTreatmentById } from '@/lib/db'
import { createTreatment, updateTreatment, deleteTreatment } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { TreatmentsTable } from './TreatmentsTable'
import { Field, FormSection, TextInput, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'
import type { Treatment } from '@prisma/client'

export default async function TreatmentsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getTreatments()
  const editing = params.edit ? await getTreatmentById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateTreatment.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Operations', 'Treatments']}
        action={!showForm ? (
          <Link href="/admin/treatments?new=1" style={newBtnStyle}>+ New treatment</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/treatments" style={backLinkStyle}>← Back to treatments</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/treatments" style={cancelBtnStyle}>Cancel</Link>
              <button form="treatment-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create treatment'}</button>
            </div>
          </div>
          <PageHead title={editing ? editing.nameEn : 'New treatment'} />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={cardStyle}>
              <form id="treatment-form" action={editing ? updateWithId! : createTreatment}>
                <FormSection title="Identity">
                  <Field label="Name (EN)" w="calc(50% - 8px)"><TextInput name="nameEn" defaultValue={editing?.nameEn} required /></Field>
                  <Field label="Name (FR)" w="calc(50% - 8px)"><TextInput name="nameFr" defaultValue={editing?.nameFr} required /></Field>
                  <Field label="Duration" w="calc(50% - 8px)"><TextInput name="duration" defaultValue={editing?.duration} placeholder="60 min" required /></Field>
                  <Field label="Price" w="calc(50% - 8px)"><TextInput name="price" defaultValue={editing?.price} placeholder="€120" required /></Field>
                </FormSection>
                <FormSection title="Publication" last>
                  <Field label="Order" w="160px"><TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} /></Field>
                  <Field label=" " full><CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} /></Field>
                </FormSection>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Treatments" lede="Spa and wellness menu." />
          <div style={{ padding: '8px 32px 48px' }}>
            <TreatmentsTable rows={items} deleteAction={deleteTreatment} />
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
