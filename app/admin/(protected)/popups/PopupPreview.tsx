'use client'

import { useEffect, useState } from 'react'
import { PopupCard, resolvePopupHref, type PopupContent } from '@/components/PopupCard'
import { T } from '@/components/admin/tokens'

// Mirrors the form as the admin types. The image URL lives in a hidden input
// that ImageUpload sets programmatically (no input event), so the form is
// re-read on a short interval rather than only on input.
export function PopupPreview({ formId }: { formId: string }) {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const [content, setContent] = useState<PopupContent | null>(null)

  useEffect(() => {
    const readForm = () => {
      const form = document.getElementById(formId) as HTMLFormElement | null
      if (!form) return
      const fd = new FormData(form)
      const get = (k: string) => String(fd.get(k) ?? '').trim()
      const pick = (base: string) => (lang === 'fr' ? get(`${base}Fr`) : '') || get(`${base}En`)
      const { href, external } = resolvePopupHref(get('ctaUrl'), lang)
      const next: PopupContent = {
        eyebrow: pick('eyebrow'),
        title: pick('title') || 'Popup title',
        description: pick('description'),
        offer: pick('offer'),
        ctaLabel: pick('ctaLabel'),
        ctaHref: href || '#',
        external,
        imageUrl: get('imageUrl'),
      }
      setContent(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    readForm()
    const t = setInterval(readForm, 500)
    return () => clearInterval(t)
  }, [formId, lang])

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14, color: T.ink }}>
          Live preview
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['en', 'fr'] as const).map(l => (
            <button key={l} type="button" onClick={() => setLang(l)} style={{
              padding: '4px 10px', borderRadius: T.radiusSm, cursor: 'pointer',
              border: `1px solid ${lang === l ? T.sienna : T.line2}`,
              background: lang === l ? T.siennaSoft : T.surface,
              color: lang === l ? T.sienna : T.ink2,
              fontFamily: 'var(--sans, system-ui)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
            }}>{l}</button>
          ))}
        </div>
      </div>
      {/* Links are inert in the preview. */}
      <div style={{ background: 'rgba(20,14,9,0.62)', padding: 14, borderRadius: T.radiusSm, pointerEvents: 'none' }}>
        {content && (
          <div style={{ zoom: 0.62 }}>
            <PopupCard content={content} closeLabel="Close" />
          </div>
        )}
      </div>
    </div>
  )
}
