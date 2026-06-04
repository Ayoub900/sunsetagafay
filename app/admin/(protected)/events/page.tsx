import Link from 'next/link'
import { getEvents, getEventById } from '@/lib/db'
import { createEvent, updateEvent, deleteEvent } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { EventsTable } from './EventsTable'
import { GalleryUpload } from '@/components/admin/GalleryUpload'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Field, FormSection, TextInput, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getEvents()
  const editing = params.edit ? await getEventById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateEvent.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Programming', 'Events']}
        action={!showForm ? (
          <Link href="/admin/events?new=1" style={newBtnStyle}>+ New event</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/events" style={backLinkStyle}>← Back to events</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/events" style={cancelBtnStyle}>Cancel</Link>
              <button form="event-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create event'}</button>
            </div>
          </div>
          <PageHead
            title={editing ? editing.nameEn : 'New event'}
            lede={editing
              ? `Capacity ${editing.capacity}. Changes go live on save.`
              : 'Add a new ceremony or gathering. Drafts stay hidden until set to Active.'}
          />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
                <form id="event-form" action={editing ? updateWithId! : createEvent}>
                  <FormSection title="Identity">
                    <Field label="Slug (URL)" w="calc(50% - 8px)"><TextInput name="slug" defaultValue={editing?.slug} required /></Field>
                    <Field label="Capacity" w="calc(50% - 8px)"><TextInput name="capacity" defaultValue={editing?.capacity} required /></Field>
                    <Field label="Name (EN)" w="calc(50% - 8px)"><TextInput name="nameEn" defaultValue={editing?.nameEn} required /></Field>
                    <Field label="Name (FR)" w="calc(50% - 8px)"><TextInput name="nameFr" defaultValue={editing?.nameFr} required /></Field>
                    <Field label="Venue / Lieu (EN)" w="calc(50% - 8px)"><TextInput name="venueEn" defaultValue={(editing as { venueEn?: string } | null)?.venueEn ?? 'Full kasbah'} /></Field>
                    <Field label="Venue / Lieu (FR)" w="calc(50% - 8px)"><TextInput name="venueFr" defaultValue={(editing as { venueFr?: string } | null)?.venueFr ?? 'Kasbah complète'} /></Field>
                  </FormSection>

                  <FormSection title="Short Description">
                    <Field label="Lede — one sentence shown on the listing page (EN)" full><TextInput name="ledeEn" defaultValue={editing?.ledeEn ?? ''} /></Field>
                    <Field label="Lede — one sentence shown on the listing page (FR)" full><TextInput name="ledeFr" defaultValue={editing?.ledeFr ?? ''} /></Field>
                  </FormSection>

                  <FormSection title="Full Description (EN)">
                    <Field label="Rich text shown only on the event detail page — English" full>
                      <RichTextEditor name="copyEn" formId="event-form" defaultValue={editing?.copyEn ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (FR)">
                    <Field label="Rich text shown only on the event detail page — French" full>
                      <RichTextEditor name="copyFr" formId="event-form" defaultValue={editing?.copyFr ?? ''} />
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
                  formId="event-form"
                  fieldName="heroImageUrl"
                  label="Hero image"
                  hint="Full-width banner at the top of the detail page. Falls back to the cover photo if left empty."
                />

                <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 20 }}>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                      Photo gallery
                    </h3>
                    <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3 }}>
                      Shown as a slideshow in the detail body. First photo is the cover used on listings — drag to reorder.
                    </p>
                  </div>
                  <GalleryUpload
                    currentImages={editing?.images?.length ? editing.images : (editing?.imageUrl ? [editing.imageUrl] : [])}
                    formId="event-form"
                  />
                </div>

                <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 20 }}>
                  <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
                    Quick reference
                  </h3>
                  {editing ? (
                    <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2, lineHeight: 1.7 }}>
                      <div><strong>Slug:</strong> {editing.slug}</div>
                      <div><strong>Capacity:</strong> {editing.capacity}</div>
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
                      Fill in the form to create a new event.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Events" lede="Ceremonies, gatherings and bespoke occasions." />
          <div style={{ padding: '8px 32px 48px' }}>
            <EventsTable rows={items} deleteAction={deleteEvent} />
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
