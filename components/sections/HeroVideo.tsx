'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Background hero video + poster.
 *
 * LCP strategy: the poster is a real <img> layered ON TOP of the video (not the
 * video's `poster` attribute, which Chrome does not treat as an LCP candidate).
 * Because the <img> is the topmost full-viewport element, it is a guaranteed LCP
 * candidate and paints early from its high-priority preload. The video sits
 * behind it and is occluded until it starts playing, so the video's first frame
 * — which only arrives after the deferred download on slow links — never becomes
 * the LCP. Once the video is actually playing we fade the poster out to reveal
 * it; the LCP is already locked to the poster's early paint and the same-sized
 * video frame can't supersede it.
 *
 * Client component because mobile browsers are fussy about muted autoplay: React
 * doesn't always reflect `muted` onto the DOM node, and the `play()` promise can
 * reject (iOS Low Power Mode, backgrounded tab). We force muted via the ref and
 * defer playback until the page is idle so the video never competes with the LCP.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Required for autoplay on iOS/Android — set as a property, not just an attr.
    video.muted = true
    video.defaultMuted = true

    const onPlaying = () => setPlaying(true)
    video.addEventListener('playing', onPlaying)

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

    // Defer the video download until the page has painted and gone idle, so the
    // file never competes for bandwidth with the LCP poster on slow links.
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

    // Retry once data is in, in case the first attempt fired too early.
    video.addEventListener('loadeddata', tryPlay)
    return () => {
      window.removeEventListener('load', start)
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('playing', onPlaying)
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
      if (idleId !== undefined) cic ? cic(idleId) : window.clearTimeout(idleId)
    }
  }, [])

  return (
    <>
      {/*
        Poster is the BOTTOM layer and stays opacity:1 forever. It must never be
        hidden, because an opacity:0 image is disqualified as an LCP candidate —
        which would push the LCP onto the (web-font-gated) hero text. Kept always
        painted, this full-viewport <img> is the LCP and resolves early from its
        high-priority preload.
      */}
      <img
        src="/hero-poster.webp"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />

      {/* Video sits ON TOP of the poster and fades in once it's actually playing.
          It starts transparent so the poster (the LCP) is fully visible first. */}
      <video
        ref={ref}
        aria-hidden="true"
        loop
        muted
        playsInline
        preload="none"
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          pointerEvents: 'none',
          opacity: playing ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
    </>
  )
}
