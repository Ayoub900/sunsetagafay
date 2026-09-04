import Link from 'next/link'
import { getDayPasses, getDayPassById } from '@/lib/db'
import { createDayPass, updateDayPass, deleteDayPass } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { DayPassesTable } from './DayPassesTable'
import { GalleryUpload } from '@/components/admin/GalleryUpload'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Field, FormSection, TextInput, TextArea, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'

export default async function DayPassesPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getDayPasses()
  const editing = params.edit ? await getDayPassById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateDayPass.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Programming', 'Day Passes']}
        action={!showForm ? (
          <Link href="/admin/day-passes?new=1" style={newBtnStyle}>+ New day pass</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/day-passes" style={backLinkStyle}>← Back to day passes</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/day-passes" style={cancelBtnStyle}>Cancel</Link>
              <button form="daypass-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create day pass'}</button>
            </div>
          </div>
          <PageHead
            title={editing ? editing.nameEn : 'New day pass'}
            lede={editing
              ? `${editing.currency || '€'} ${editing.price || '—'}${editing.hours ? ` · ${editing.hours}` : ''}. Changes go live on save.`
              : 'Add a new day pass option. Drafts stay hidden until set to Active.'}
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
                <form id="daypass-form" action={editing ? updateWithId! : createDayPass}>
                  <FormSection title="Identity">
                    <Field label="Slug (URL)" w="calc(50% - 8px)" hint="e.g. swimming-pool-dinner"><TextInput name="slug" defaultValue={editing?.slug} required /></Field>
                    <Field label="Name (EN)" w="calc(50% - 8px)"><TextInput name="nameEn" defaultValue={editing?.nameEn} required /></Field>
                    <Field label="Name (FR)" w="calc(50% - 8px)"><TextInput name="nameFr" defaultValue={editing?.nameFr} required /></Field>
                    <Field label="Hours" w="calc(50% - 8px)" hint="e.g. 16:00 — 19:00"><TextInput name="hours" defaultValue={editing?.hours ?? ''} /></Field>
                    <Field label="Price" w="calc(50% - 8px)" hint="Marketing price shown on the site"><TextInput name="price" defaultValue={editing?.price ?? ''} placeholder="55,00" /></Field>
                    <Field label="Currency" w="calc(50% - 8px)"><TextInput name="currency" defaultValue={editing?.currency ?? '€'} /></Field>
                  </FormSection>

                  <FormSection title="Online payment">
                    <Field
                      label="Online price (MAD / adult)"
                      w="calc(50% - 8px)"
                      hint="What the card is actually charged. 0 = no online payment (the form sends an enquiry instead)."
                    >
                      <TextInput
                        name="priceMad"
                        type="number"
                        defaultValue={editing ? String((editing.priceMadCents ?? 0) / 100) : '0'}
                        placeholder="600"
                      />
                    </Field>
                    <Field
                      label="Online price (MAD / child)"
                      w="calc(50% - 8px)"
                      hint="0 = children are not charged"
                    >
                      <TextInput
                        name="childPriceMad"
                        type="number"
                        defaultValue={editing ? String((editing.childPriceMadCents ?? 0) / 100) : '0'}
                        placeholder="300"
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Short Description (EN)">
                    <Field label="Summary shown in nav and on top of the page — English" full>
                      <TextArea name="ledeEn" rows={2} defaultValue={editing?.ledeEn ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Short Description (FR)">
                    <Field label="Summary shown in nav and on top of the page — French" full>
                      <TextArea name="ledeFr" rows={2} defaultValue={editing?.ledeFr ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (EN)">
                    <Field label="Rich text shown on the day pass page — English" full>
                      <RichTextEditor name="copyEn" formId="daypass-form" defaultValue={editing?.copyEn ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (FR)">
                    <Field label="Rich text shown on the day pass page — French" full>
                      <RichTextEditor name="copyFr" formId="daypass-form" defaultValue={editing?.copyFr ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Publication" last>
                    <Field label="Order" w="160px"><TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} /></Field>
                    <Field label=" " full><CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} /></Field>
                  </FormSection>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ImageUpload
                  currentUrl={(editing as { heroImageUrl?: string } | null)?.heroImageUrl ?? ''}
                  formId="daypass-form"
                  fieldName="heroImageUrl"
                  label="Hero image"
                  hint="Full-width banner at the top of the page. Falls back to the cover photo if left empty."
                />

                <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 20 }}>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                      Photo gallery
                    </h3>
                    <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3 }}>
                      Shown as a slideshow in the body. First photo is the cover used on listings — drag to reorder.
                    </p>
                  </div>
                  <GalleryUpload
                    currentImages={editing?.images?.length ? editing.images : (editing?.imageUrl ? [editing.imageUrl] : [])}
                    formId="daypass-form"
                  />
                </div>

                <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 20 }}>
                  <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                    Quick reference
                  </h3>
                  {editing ? (
                    <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2, lineHeight: 1.7 }}>
                      <div><strong>Price:</strong> {editing.currency || '€'} {editing.price || '—'}</div>
                      <div><strong>Hours:</strong> {editing.hours || '—'}</div>
                      <div><strong>Slug:</strong> {editing.slug}</div>
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
                      Fill in the form to create a new day pass.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Day Passes" lede="Pool, lunch and dinner day pass variants." />
          <div style={{ padding: '8px 32px 48px' }}>
            <DayPassesTable rows={items} deleteAction={deleteDayPass} />
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
