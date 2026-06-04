'use client'

import { useRef, useState } from 'react'
import { T } from './tokens'
import { Icon } from './icons'

interface Props {
  currentUrl: string
  formId: string
  label?: string
  hint?: string
  /** Form field name the chosen URL is submitted under. Defaults to "imageUrl". */
  fieldName?: string
}

export function ImageUpload({ currentUrl, formId, label = 'Photograph', hint = 'Used on cards and detail pages', fieldName = 'imageUrl' }: Props) {
  const [preview, setPreview]       = useState<string>(currentUrl)
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setUploadedUrl(url)
      setPreview(url)
    } catch {
      setPreview(currentUrl)
      setUploadedUrl(currentUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: T.radius, boxShadow: T.shadow, padding: 20,
    }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
          {label}
        </h3>
        <p style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3 }}>
          {hint}
        </p>
      </div>

      {/* Hidden input that carries the URL into the server action form */}
      <input type="hidden" name={fieldName} form={formId} value={uploadedUrl} />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        style={{
          position: 'relative', aspectRatio: '4/3',
          border: `2px dashed ${dragOver ? T.sienna : T.line2}`,
          background: dragOver ? T.siennaSoft : T.surfaceAlt,
          borderRadius: T.radiusSm, cursor: 'pointer', overflow: 'hidden',
          transition: 'background 180ms, border-color 180ms',
        }}
      >
        <input
          ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />

        {preview ? (
          <>
            <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(247,241,228,0.8)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2,
              }}>Uploading…</div>
            )}
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            color: T.ink2, textAlign: 'center', padding: 24,
          }}>
            <div>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: T.surface, border: `1px solid ${T.line}`,
                margin: '0 auto 12px',
                display: 'grid', placeItems: 'center', color: T.sienna,
              }}>
                <Icon name="image" size={22} />
              </div>
              <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14.5, fontWeight: 600, color: T.ink }}>
                Drop an image here
              </div>
              <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3, marginTop: 4 }}>
                or click to browse · converts to WebP
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={{
          padding: '8px 12px', background: T.surface, color: T.ink,
          border: `1px solid ${T.line2}`, borderRadius: T.radiusSm,
          fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Icon name="upload" size={14} />
          {preview ? 'Replace' : 'Upload'}
        </button>
        <button type="button" onClick={() => { setPreview(''); setUploadedUrl('') }} style={{
          padding: '8px 12px', background: 'transparent', color: T.sienna,
          border: `1px solid rgba(160,74,42,0.36)`, borderRadius: T.radiusSm,
          fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Icon name="trash" size={14} />
          Remove
        </button>
      </div>
    </div>
  )
}
