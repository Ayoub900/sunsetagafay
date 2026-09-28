'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PopupCard, type PopupContent } from './PopupCard'

export type SitePopupData = {
  id: string
  startDate: string
  endDate: string
  delaySeconds: number
  frequency: string
  showOn: string
  content: PopupContent
}

const DAY_MS = 24 * 60 * 60 * 1000
const storageKey = (id: string) => `sa_popup_${id}`

// Storage can be unavailable (private mode, blocked site data); a failed read
// counts as "not seen", a failed write just means it may show again.
function read(store: 'local' | 'session', key: string): string | null {
  try { return (store === 'local' ? localStorage : sessionStorage).getItem(key) } catch { return null }
}
function write(store: 'local' | 'session', key: string, value: string) {
  try { (store === 'local' ? localStorage : sessionStorage).setItem(key, value) } catch {}
}

function alreadySeen(p: SitePopupData): boolean {
  const key = storageKey(p.id)
  if (p.frequency === 'session') return read('session', key) != null
  const v = read('local', key)
  if (v == null) return false
  if (p.frequency === 'daily') return Date.now() - Number(v) < DAY_MS
  return true
}

function markSeen(p: SitePopupData) {
  write(p.frequency === 'session' ? 'session' : 'local', storageKey(p.id), String(Date.now()))
}

function localIsoDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Checkout and payment result pages stay free of marketing interruptions.
const SUPPRESSED = /^\/(en|fr)\/reserve(\/|$)/

export function SitePopup({ popups, lang }: { popups: SitePopupData[]; lang: 'en' | 'fr' }) {
  const pathname = usePathname()
  const [current, setCurrent] = useState<SitePopupData | null>(null)
  const [visible, setVisible] = useState(false)
  const shown = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Pick at most one popup per visit, on the first page that qualifies.
  useEffect(() => {
    if (shown.current || SUPPRESSED.test(pathname)) return
    const isHome = pathname === `/${lang}` || pathname === `/${lang}/`
    const today = localIsoDate()
    const pick = popups.find(p =>
      (p.showOn !== 'home' || isHome) &&
      (!p.startDate || p.startDate <= today) &&
      (!p.endDate || p.endDate >= today) &&
      !alreadySeen(p),
    )
    if (!pick) return
    const t = setTimeout(() => {
      shown.current = true
      setCurrent(pick)
      markSeen(pick)
    }, pick.delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [pathname, popups, lang])

  // Mount first, then flip `visible` so the CSS transition runs.
  useEffect(() => {
    if (!current) return
    const r = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(r)
  }, [current])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(() => setCurrent(null), 250)
  }, [])

  useEffect(() => {
    if (!current) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('.sa-popup-close')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [current, close])

  if (!current) return null

  const titleId = `sa-popup-title-${current.id}`
  return (
    <div
      className={`sa-popup-overlay${visible ? ' is-visible' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <PopupCard
          content={current.content}
          closeLabel={lang === 'fr' ? 'Fermer' : 'Close'}
          onClose={close}
          titleId={titleId}
        />
      </div>
    </div>
  )
}
