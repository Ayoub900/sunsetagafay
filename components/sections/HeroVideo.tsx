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
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          /* Autoplay blocked (e.g. iOS Low Power Mode) — poster stays visible. */
        })
      }
    }

    tryPlay()
    // Retry once metadata is in, in case the first attempt fired too early.
    video.addEventListener('loadeddata', tryPlay)
    return () => video.removeEventListener('loadeddata', tryPlay)
  }, [])

  return (
    <video
      ref={ref}
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster="/hero-poster.jpg"
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        width: '100%', height: '100%', objectFit: 'cover',
        pointerEvents: 'none',
      }}
    >
      <source src="/hero.webm" type="video/webm" />
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )
}
