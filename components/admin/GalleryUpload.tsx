'use client'

import { useRef, useState } from 'react'
import { T } from './tokens'
import { Icon } from './icons'

interface Props {
  currentImages: string[]
  formId: string
}

export function GalleryUpload({ currentImages, formId }: Props) {
  const [images, setImages] = useState<string[]>(currentImages.filter(Boolean))
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!res.ok) continue
        const { url } = await res.json()
        uploaded.push(url)
      }
      setImages(prev => [...prev, ...uploaded])
    } finally {
      setUploading(false)
    }
  }

  const remove = (idx: number) =>
    setImages(prev => prev.filter((_, i) => i !== idx))

  const moveLeft = (idx: number) =>
    setImages(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })

  const moveRight = (idx: number) =>
    setImages(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })

  return (
    <div>
      {images.map((url, i) => (
        <input key={i} type="hidden" name="images" form={formId} value={url} />
      ))}
      <input type="hidden" name="imageUrl" form={formId} value={images[0] ?? ''} />

      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8, marginBottom: 12,
        }}>
          {images.map((url, i) => (
            <div key={url + i} style={{
              position: 'relative', aspectRatio: '4/3',
              borderRadius: T.radiusSm, overflow: 'hidden',
              border: i === 0 ? `2px solid ${T.sienna}` : `1px solid ${T.line2}`,
              boxShadow: T.shadow,
            }}>
              <img
                src={url} alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {i === 0 && (
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: T.sienna, color: '#FFF8EE',
                  fontSize: 9, fontFamily: 'var(--sans, system-ui)', fontWeight: 600,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 3,
                }}>Cover</div>
              )}

              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(31,26,20,0)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: 4, gap: 3,
                opacity: 0, transition: 'opacity 140ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                {i > 0 && (
                  <ThumbBtn title="Move left" onClick={() => moveLeft(i)}>←</ThumbBtn>
                )}
                {i < images.length - 1 && (
                  <ThumbBtn title="Move right" onClick={() => moveRight(i)}>→</ThumbBtn>
                )}
                <ThumbBtn title="Remove" onClick={() => remove(i)} danger>×</ThumbBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '20px 16px',
          border: `2px dashed ${dragOver ? T.sienna : T.line2}`,
          background: dragOver ? T.siennaSoft : T.surfaceAlt,
          borderRadius: T.radiusSm, cursor: uploading ? 'default' : 'pointer',
          transition: 'background 160ms, border-color 160ms',
        }}
      >
        <input
          ref={fileRef} type="file" accept="image/*" multiple
          style={{ display: 'none' }}
          onChange={e => uploadFiles(e.target.files)}
        />
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: T.surface, border: `1px solid ${T.line}`,
          display: 'grid', placeItems: 'center', color: T.sienna,
        }}>
          <Icon name="image" size={18} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 600, color: T.ink }}>
            {uploading ? 'Uploading…' : images.length > 0 ? 'Add more photos' : 'Drop photos here'}
          </div>
          <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3, marginTop: 2 }}>
            {uploading ? 'Please wait' : 'or click to browse · multiple files allowed · converts to WebP'}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <p style={{ margin: '8px 0 0', fontFamily: 'var(--sans, system-ui)', fontSize: 11.5, color: T.ink3 }}>
          First photo is the cover image. Hover thumbnails to reorder or remove.
        </p>
      )}
    </div>
  )
}

function ThumbBtn({ children, onClick, title, danger }: {
  children: React.ReactNode
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        width: 22, height: 22, padding: 0,
        background: danger ? '#A04A2A' : 'rgba(31,26,20,0.72)',
        color: '#fff', border: 'none', borderRadius: 4,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'grid', placeItems: 'center', lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}
