import Link from 'next/link'
import { getExperiences, getExperienceById } from '@/lib/db'
import { createExperience, updateExperience, deleteExperience } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { ExperiencesTable } from './ExperiencesTable'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Field, FormSection, TextInput, TextArea, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getExperiences()
  const editing = params.edit ? await getExperienceById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateExperience.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Programming', 'Experiences']}
        action={!showForm ? (
          <Link href="/admin/experiences?new=1" style={newBtnStyle}>+ New experience</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/experiences" style={backLinkStyle}>← Back to experiences</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/experiences" style={cancelBtnStyle}>Cancel</Link>
              <button form="experience-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create experience'}</button>
            </div>
          </div>
          <PageHead title={editing ? editing.nameEn : 'New experience'} />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
                <form id="experience-form" action={editing ? updateWithId! : createExperience}>
                  <FormSection title="Identity">
                    <Field label="Number / reference" w="160px"><TextInput name="n" defaultValue={editing?.n} required /></Field>
                    <Field label="Name (EN)" w="calc(50% - 8px)"><TextInput name="nameEn" defaultValue={editing?.nameEn} required /></Field>
                    <Field label="Name (FR)" w="calc(50% - 8px)"><TextInput name="nameFr" defaultValue={editing?.nameFr} required /></Field>
                    <Field label="When / schedule" w="calc(50% - 8px)"><TextInput name="when" defaultValue={editing?.when} required /></Field>
                    <Field label="Who / guide" w="calc(50% - 8px)"><TextInput name="who" defaultValue={editing?.who} required /></Field>
                  </FormSection>
                  <FormSection title="Description">
                    <Field label="Lede (EN)" w="calc(50% - 8px)"><TextArea name="ledeEn" defaultValue={editing?.ledeEn} rows={3} required /></Field>
                    <Field label="Lede (FR)" w="calc(50% - 8px)"><TextArea name="ledeFr" defaultValue={editing?.ledeFr} rows={3} required /></Field>
                  </FormSection>
                  <FormSection title="Publication" last>
                    <Field label="Order" w="160px"><TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} /></Field>
                    <Field label=" " full><CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} /></Field>
                  </FormSection>
                </form>
              </div>
              <ImageUpload
                currentUrl={editing?.imageUrl ?? ''}
                formId="experience-form"
                label="Experience photograph"
                hint="Shown alongside the experience listing"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Experiences" lede="Curated activities and guided experiences for guests." />
          <div style={{ padding: '8px 32px 48px' }}>
            <ExperiencesTable rows={items} deleteAction={deleteExperience} />
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
