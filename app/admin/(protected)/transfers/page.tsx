import Link from 'next/link'
import { getTransfers, getTransferById } from '@/lib/db'
import { createTransfer, updateTransfer, deleteTransfer } from './actions'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { TransfersTable } from './TransfersTable'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Field, FormSection, TextInput, TextArea, CheckboxField } from '@/components/admin/FormAtoms'
import { T } from '@/components/admin/tokens'

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const params = await searchParams
  const items = await getTransfers()
  const editing = params.edit ? await getTransferById(params.edit) : null
  const showForm = params.new === '1' || !!editing
  const updateWithId = editing ? updateTransfer.bind(null, editing.id) : null

  return (
    <>
      <AdminTopbar crumbs={['Operations', 'Transfers']}
        action={!showForm ? (
          <Link href="/admin/transfers?new=1" style={newBtnStyle}>+ New transfer</Link>
        ) : undefined}
      />

      {showForm ? (
        <>
          <div style={backBarStyle}>
            <Link href="/admin/transfers" style={backLinkStyle}>← Back to transfers</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/transfers" style={cancelBtnStyle}>Cancel</Link>
              <button form="transfer-form" type="submit" style={saveBtnStyle}>{editing ? 'Save changes' : 'Create transfer'}</button>
            </div>
          </div>
          <PageHead title={editing ? editing.nameEn : 'New transfer'} />
          <div style={{ padding: '8px 32px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 28 }}>
                <form id="transfer-form" action={editing ? updateWithId! : createTransfer}>
                  <FormSection title="Identity">
                    <Field label="Slug" w="calc(50% - 8px)"><TextInput name="slug" defaultValue={editing?.slug} required /></Field>
                    <Field label="Name (EN)" w="calc(50% - 8px)"><TextInput name="nameEn" defaultValue={editing?.nameEn} required /></Field>
                    <Field label="Name (FR)" w="calc(50% - 8px)"><TextInput name="nameFr" defaultValue={editing?.nameFr} required /></Field>
                    <Field label="Duration" w="calc(50% - 8px)"><TextInput name="duration" defaultValue={editing?.duration} required /></Field>
                    <Field label="Price" w="calc(50% - 8px)"><TextInput name="price" defaultValue={editing?.price} required /></Field>
                  </FormSection>
                  <FormSection title="Short Description (EN)">
                    <Field label="Summary shown on listing — English" full>
                      <TextArea name="ledeEn" rows={2} defaultValue={editing?.ledeEn ?? ''} required />
                    </Field>
                  </FormSection>

                  <FormSection title="Short Description (FR)">
                    <Field label="Summary shown on listing — French" full>
                      <TextArea name="ledeFr" rows={2} defaultValue={editing?.ledeFr ?? ''} required />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (EN)">
                    <Field label="Rich text shown on the transfer detail page — English" full>
                      <RichTextEditor name="copyEn" formId="transfer-form" defaultValue={editing?.copyEn ?? ''} />
                    </Field>
                  </FormSection>

                  <FormSection title="Full Description (FR)">
                    <Field label="Rich text shown on the transfer detail page — French" full>
                      <RichTextEditor name="copyFr" formId="transfer-form" defaultValue={editing?.copyFr ?? ''} />
                    </Field>
                  </FormSection>
                  <FormSection title="Publication" last>
                    <Field label="Order" w="160px"><TextInput name="order" type="number" defaultValue={String(editing?.order ?? 0)} /></Field>
                    <Field label=" " full><CheckboxField name="active" label="Active (visible on site)" defaultChecked={editing?.active ?? true} /></Field>
                  </FormSection>
                </form>
              </div>
              <ImageUpload
                currentUrl={editing?.imageUrl ?? ''}
                formId="transfer-form"
                label="Transfer photograph"
                hint="Used on transfer listing cards"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHead title="Transfers" lede="Airport and city transfer services." />
          <div style={{ padding: '8px 32px 48px' }}>
            <TransfersTable rows={items} deleteAction={deleteTransfer} />
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
