import Link from 'next/link'
import { getSuites, getSuiteById } from '@/lib/db'
import { createSuite, updateSuite, deleteSuite } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { SuitesTable } from './SuitesTable'
import { T } from '@/components/admin/tokens'
import { Field, FormSection, TextInput, TextArea, SelectInput, CheckboxField } from '@/components/admin/FormAtoms'
import { SuiteGalleryUpload } from './SuiteGalleryUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

const imageKinds = ['sunset', 'palms', 'courtyard', 'aperitif', 'pool']

export default async function SuitesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>
}) {
  const params = await searchParams
  const suites = await getSuites()
  const editing = params.edit ? await getSuiteById(params.edit) : null
  const showNew = params.new === '1'
  const showForm = showNew || !!editing

  const updateWithId = editing ? updateSuite.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar
        crumbs={['Maison', 'Suites']}
        action={
          !showForm ? (
            <Link href="/admin/suites?new=1" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', height: 36,
              background: T.sienna, color: '#FFF8EE',
              border: `1px solid ${T.sienna}`, borderRadius: T.radiusSm,
              fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>+ New suite</Link>
          ) : undefined
        }
      />

      {showForm ? (
        <>
          {/* Back bar */}
          <div style={{
            padding: '18px 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: `1px solid ${T.line}`,
            background: T.surface,
          }}>
            <Link href="/admin/suites" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500,
              color: T.ink2, textDecoration: 'none',
            }}>← Back to suites</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/suites" style={{
                padding: '8px 14px', background: T.surface, color: T.ink,
                border: `1px solid ${T.line2}`, borderRadius: T.radiusSm,
                fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, textDecoration: 'none',
              }}>Cancel</Link>
              <button form="suite-form" type="submit" style={{
                padding: '8px 18px', background: T.sienna, color: '#FFF8EE',
                border: 'none', borderRadius: T.radiusSm,
                fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              }}>
                {editing ? 'Save changes' : 'Create suite'}
              </button>
            </div>
          </div>

          <PageHead
            title={editing ? editing.nameEn : 'New suite'}
            lede={editing
              ? `${editing.area} · ${editing.view}. Changes go live on save.`
              : 'Add a new room. Drafts stay hidden until set to Active.'}
          />

          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* ── Main form ── */}
              <div style={{
                background: T.surface, border: `1px solid ${T.line}`,
                borderRadius: T.radius, boxShadow: T.shadow, padding: 28,
              }}>
                <form id="suite-form" action={editing ? updateWithId! : createSuite}>
                  <FormSection title="Identity">
                    <Field label="Name (EN)" w="calc(50% - 8px)">
                      <TextInput name="nameEn" defaultValue={editing?.nameEn} placeholder="Chambre Olivier" required />
                    </Field>
                    <Field label="Name (FR)" w="calc(50% - 8px)">
                      <TextInput name="nameFr" defaultValue={editing?.nameFr} placeholder="Chambre Olivier" required />
                    </Field>
                    <Field label="Slug (URL)" w="calc(50% - 8px)">
                      <TextInput name="slug" defaultValue={editing?.slug} placeholder="chambre-olivier" required />
                    </Field>
                  </FormSection>

                  <FormSection title="Details">
                    <Field label="Area" w="calc(50% - 8px)">
                      <TextInput name="area" defaultValue={editing?.area} placeholder="45 m²" required />
                    </Field>
                    <Field label="View" w="calc(50% - 8px)">
                      <TextInput name="view" defaultValue={editing?.view} placeholder="Olive court" required />
                    </Field>
                    <Field label="Rate" w="calc(50% - 8px)">
                      <TextInput name="rate" defaultValue={editing?.rate} placeholder="€580" required />
                    </Field>
                    <Field label="Order" w="calc(50% - 8px)">
                      <TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} />
                    </Field>
                  </FormSection>

                  <FormSection title="Short Description (EN)">
                    <Field label="Summary shown on listing & home — English" full>
                      <TextArea
                        name="briefEn"
                        rows={3}
                        defaultValue={editing?.briefEn ?? ''}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Short Description (FR)">
                    <Field label="Summary shown on listing & home — French" full>
                      <TextArea
                        name="briefFr"
                        rows={3}
                        defaultValue={editing?.briefFr ?? ''}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (EN)">
                    <Field label="Rich text shown only on the suite detail page — English" full>
                      <RichTextEditor
                        name="descriptionEn"
                        formId="suite-form"
                        defaultValue={(editing as { descriptionEn?: string } | null)?.descriptionEn ?? ''}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (FR)">
                    <Field label="Rich text shown only on the suite detail page — French" full>
                      <RichTextEditor
                        name="descriptionFr"
                        formId="suite-form"
                        defaultValue={(editing as { descriptionFr?: string } | null)?.descriptionFr ?? ''}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Publication" last>
                    <Field label="Image kind (fallback)" w="200px">
                      <SelectInput name="imageKind" defaultValue={editing?.imageKind ?? 'sunset'} options={imageKinds} />
                    </Field>
                    <Field label=" " w="calc(50% - 8px)">
                      <CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} />
                    </Field>
                  </FormSection>
                </form>
              </div>

              {/* ── Sidebar ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Gallery upload card */}
                <div style={{
                  background: T.surface, border: `1px solid ${T.line}`,
                  borderRadius: T.radius, boxShadow: T.shadow, padding: 20,
                }}>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                      Photo gallery
                    </h3>
                    <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3 }}>
                      First photo is the cover. Upload multiple — drag to reorder.
                    </p>
                  </div>
                  <SuiteGalleryUpload
                    currentImages={editing?.images?.length ? editing.images : (editing?.imageUrl ? [editing.imageUrl] : [])}
                    formId="suite-form"
                  />
                </div>

                {/* Quick reference card */}
                <div style={{
                  background: T.surface, border: `1px solid ${T.line}`,
                  borderRadius: T.radius, boxShadow: T.shadow, padding: 20,
                }}>
                  <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                    Quick reference
                  </h3>
                  {editing ? (
                    <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2, lineHeight: 1.7 }}>
                      <div><strong>Area:</strong> {editing.area}</div>
                      <div><strong>View:</strong> {editing.view}</div>
                      <div><strong>Rate:</strong> {editing.rate}</div>
                      <div><strong>Photos:</strong> {(editing.images?.length || (editing.imageUrl ? 1 : 0))} uploaded</div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 10px', borderRadius: 999,
                          background: editing.active ? T.okSoft : 'rgba(31,26,20,0.04)',
                          color: editing.active ? '#3F6238' : T.ink3,
                          fontSize: 12, fontWeight: 500,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: editing.active ? T.ok : T.ink3 }} />
                          {editing.active ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>
                      Fill in the form to create a new suite.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead
            title="Suites"
            lede="All rooms on file. Edit rates, capacity, and photographs."
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <SuitesTable rows={suites} deleteAction={deleteSuite} />
          </div>
        </>
      )}
    </>
  )
}
