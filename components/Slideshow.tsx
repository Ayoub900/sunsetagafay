'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  images: string[]
  alt: string
  /** CSS aspect-ratio of the frame. Defaults to "4/5". */
  aspectRatio?: string
  /** Auto-advance interval in ms. Set 0 to disable. */
  interval?: number
}

export function Slideshow({ images, alt, aspectRatio = '4/5', interval = 6000 }: Props) {
  const slides = images.filter(Boolean)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  const go = useCallback((next: number) => {
    setIndex(((next % count) + count) % count)
  }, [count])

  const prev = useCallback(() => go(index - 1), [go, index])
  const next = useCallback(() => go(index + 1), [go, index])

  // Auto-advance
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (count <= 1 || interval <= 0 || paused) return
    timer.current = setInterval(() => setIndex(i => (i + 1) % count), interval)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [count, interval, paused])

  if (count === 0) return null

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={alt}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
        if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      }}
      tabIndex={count > 1 ? 0 : -1}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Frame */}
      <div style={{ position: 'relative', width: '100%', aspectRatio, overflow: 'hidden', background: 'var(--ink, #1f1a14)' }}>
        {slides.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={i === index ? alt : ''}
            aria-hidden={i === index ? undefined : true}
            loading={i === 0 ? 'eager' : 'lazy'}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === index ? 1 : 0,
              transition: 'opacity 700ms ease',
              pointerEvents: i === index ? 'auto' : 'none',
            }}
          />
        ))}

        {/* Subtle vignette to match house style */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 2,
          boxShadow: 'inset 0 0 120px rgba(20,12,8,0.28)',
          pointerEvents: 'none',
        }} />

        {count > 1 && (
          <>
            <SlideArrow dir="prev" onClick={prev} label="Previous photo" />
            <SlideArrow dir="next" onClick={next} label="Next photo" />

            {/* Counter */}
            <div style={{
              position: 'absolute', top: 12, right: 14, zIndex: 3,
              fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.18em',
              color: 'var(--paper, #f2e8d5)', background: 'rgba(20,12,8,0.45)',
              padding: '4px 9px', borderRadius: 999, backdropFilter: 'blur(4px)',
            }}>
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </div>
          </>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              style={{
                width: i === index ? 22 : 8, height: 8, padding: 0, border: 'none',
                borderRadius: 999, cursor: 'pointer',
                background: i === index ? 'var(--brass, #b07a36)' : 'rgba(31,26,20,0.25)',
                transition: 'width 280ms ease, background 280ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SlideArrow({ dir, onClick, label }: { dir: 'prev' | 'next'; onClick: () => void; label: string }) {
  const isPrev = dir === 'prev'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 3,
        [isPrev ? 'left' : 'right']: 12,
        width: 42, height: 42, display: 'grid', placeItems: 'center',
        borderRadius: '50%', border: '1px solid rgba(242,232,213,0.45)',
        background: 'rgba(20,12,8,0.4)', color: 'var(--paper, #f2e8d5)',
        cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1,
        backdropFilter: 'blur(4px)', transition: 'background 180ms, border-color 180ms',
      } as React.CSSProperties}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,12,8,0.7)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,12,8,0.4)' }}
    >
      {isPrev ? '←' : '→'}
    </button>
  )
}
