import Link from 'next/link'
import { getPopups, getPopupById } from '@/lib/db'
import { createPopup, updatePopup, deletePopup } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { PopupsTable } from './PopupsTable'
import { PopupPreview } from './PopupPreview'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Field, FormSection, TextInput, TextArea, SelectInput, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'

const frequencyOptions = [
  { value: 'once',    label: 'Once per visitor (until dismissed)' },
  { value: 'daily',   label: 'At most once a day' },
  { value: 'session', label: 'Once per browser session' },
]

const showOnOptions = [
  { value: 'all',  label: 'Every page' },
  { value: 'home', label: 'Homepage only' },
]

export default async function PopupsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getPopups()
  const editing = params.edit ? await getPopupById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updatePopup.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Programming', 'Popups']}
        action={!showForm ? (
          <Link href="/admin/popups?new=1" style={newBtnStyle}>+ New popup</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/popups" style={backLinkStyle}>← Back to popups</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/popups" style={cancelBtnStyle}>Cancel</Link>
              <button form="popup-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create popup'}</button>
            </div>
          </div>
          <PageHead
            title={editing ? editing.name : 'New popup'}
            lede={editing
              ? 'Changes go live on save. Visitors who already dismissed this popup won\'t see it again — create a new one for a new campaign.'
              : 'Promote a party, an offer or an announcement to visitors when they arrive on the site.'}
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
                <form id="popup-form" action={editing ? updateWithId! : createPopup}>
                  <FormSection title="Internal">
                    <Field label="Name (admin only)" full hint="e.g. “Full Moon Party — July”. Never shown to visitors.">
                      <TextInput name="name" defaultValue={editing?.name} required />
                    </Field>
                  </FormSection>

                  <FormSection title="Content (EN)">
                    <Field label="Eyebrow" full hint="Small label above the title, e.g. “Limited offer”."><TextInput name="eyebrowEn" defaultValue={editing?.eyebrowEn} /></Field>
                    <Field label="Title" full><TextInput name="titleEn" defaultValue={editing?.titleEn} required /></Field>
                    <Field label="Offer highlight" full hint="Optional, e.g. “−20% on tickets booked before 15 July”."><TextInput name="offerEn" defaultValue={editing?.offerEn} /></Field>
                    <Field label="Description" full><TextArea name="descriptionEn" rows={4} defaultValue={editing?.descriptionEn} /></Field>
                    <Field label="Button label" full><TextInput name="ctaLabelEn" defaultValue={editing?.ctaLabelEn} placeholder="Book your spot" /></Field>
                  </FormSection>

                  <FormSection title="Content (FR)">
                    <Field label="Eyebrow" full><TextInput name="eyebrowFr" defaultValue={editing?.eyebrowFr} /></Field>
                    <Field label="Title" full><TextInput name="titleFr" defaultValue={editing?.titleFr} required /></Field>
                    <Field label="Offer highlight" full><TextInput name="offerFr" defaultValue={editing?.offerFr} /></Field>
                    <Field label="Description" full><TextArea name="descriptionFr" rows={4} defaultValue={editing?.descriptionFr} /></Field>
                    <Field label="Button label" full><TextInput name="ctaLabelFr" defaultValue={editing?.ctaLabelFr} placeholder="Réservez votre place" /></Field>
                  </FormSection>

                  <FormSection title="Link">
                    <Field
                      label="Button link"
                      full
                      hint="A page on this site like /sunset-parties/full-moon (the visitor's language is added automatically), or a full https:// link which opens in a new tab. Leave empty for no button."
                    >
                      <TextInput name="ctaUrl" defaultValue={editing?.ctaUrl} placeholder="/sunset-parties" />
                    </Field>
                  </FormSection>

                  <FormSection title="Targeting">
                    <Field label="Start date" w="calc(50% - 8px)" hint="Empty = starts now"><TextInput name="startDate" type="date" defaultValue={editing?.startDate} /></Field>
                    <Field label="End date" w="calc(50% - 8px)" hint="Empty = no end"><TextInput name="endDate" type="date" defaultValue={editing?.endDate} /></Field>
                    <Field label="Show on" w="calc(50% - 8px)"><SelectInput name="showOn" options={showOnOptions} defaultValue={editing?.showOn ?? 'all'} /></Field>
                    <Field label="Frequency" w="calc(50% - 8px)"><SelectInput name="frequency" options={frequencyOptions} defaultValue={editing?.frequency ?? 'once'} /></Field>
                    <Field label="Delay before showing" w="160px"><TextInput name="delaySeconds" type="number" suffix="sec" defaultValue={String(editing?.delaySeconds ?? 2)} /></Field>
                  </FormSection>

                  <FormSection title="Publication" last>
                    <Field label="Priority" w="160px" hint="Lower shows first"><TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} /></Field>
                    <Field label=" " full><CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} /></Field>
                  </FormSection>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 16 }}>
                <PopupPreview formId="popup-form" />
                <ImageUpload
                  currentUrl={editing?.imageUrl ?? ''}
                  formId="popup-form"
                  fieldName="imageUrl"
                  label="Image"
                  hint="Shown beside the text on desktop, above it on mobile. Optional."
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Popups" lede="Announcements and offers shown to visitors when they arrive. One popup at most per visit — the active one with the lowest priority number wins." />
          <div style={{ padding: '8px 32px 48px' }}>
            <PopupsTable rows={items} deleteAction={deletePopup} />
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
