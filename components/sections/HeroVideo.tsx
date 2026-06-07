'use client'

import { useEffect, useRef } from 'react'

/**
 * Background hero video. Split into a client component because mobile browsers
 * are fussy about muted-autoplay: React doesn't always reflect the `muted`
 * attribute onto the DOM node, and the autoplay `play()` promise can reject
 * (iOS Low Power Mode, backgrounded tab). We force muted via the ref and retry
 * playback once the element and metadata are ready.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Required for autoplay on iOS/Android — set as a property, not just an attr.
    video.muted = true
    video.defaultMuted = true

    const tryPlay = () => {
      // Switch from preload="none" to actually loading now, then play.
      video.preload = 'auto'
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          /* Autoplay blocked (e.g. iOS Low Power Mode) — poster stays visible. */
        })
      }
    }

    // Defer the (heavy) video download until the page has painted and gone
    // idle, so the 11MB+ file never competes with the LCP poster on slow links.
    let idleId: number | undefined
    const start = () => {
      const ric = (window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }).requestIdleCallback
      if (ric) idleId = ric(tryPlay, { timeout: 3000 })
      else idleId = window.setTimeout(tryPlay, 1200)
    }

    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    // Retry once metadata is in, in case the first attempt fired too early.
    video.addEventListener('loadeddata', tryPlay)
    return () => {
      window.removeEventListener('load', start)
      video.removeEventListener('loadeddata', tryPlay)
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
      if (idleId !== undefined) cic ? cic(idleId) : window.clearTimeout(idleId)
    }
  }, [])

  return (
    <video
      ref={ref}
      aria-hidden="true"
      loop
      muted
      playsInline
      preload="none"
      poster="/hero-poster.jpg"
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        width: '100%', height: '100%', objectFit: 'cover',
        pointerEvents: 'none',
      }}
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )
}
