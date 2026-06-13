'use client'

import { useEffect, useRef, useState } from 'react'

interface ReviewItem { quote: string; name: string; stay: string; source: string }

const CLAMP_LINES = 8

export function ReviewCard({ r, lang }: { r: ReviewItem; lang: string }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const quoteRef = useRef<HTMLQuoteElement>(null)

  // Detect whether the quote actually overflows the clamp so we only show
  // the toggle on cards that need it.
  useEffect(() => {
    const el = quoteRef.current
    if (!el) return
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const moreLabel = lang === 'fr' ? 'Lire la suite' : 'Read more'
  const lessLabel = lang === 'fr' ? 'Réduire' : 'Read less'
  const showToggle = clamped || expanded

  return (
    <figure
      style={{
        margin: 0,
        background: 'var(--paper-deep)',
        padding: 'clamp(28px,3.5vw,40px)',
        border: '1px solid rgba(31,26,20,0.10)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <span aria-hidden="true" style={{
        position: 'absolute', top: 'clamp(14px,2vw,22px)', left: 'clamp(18px,2.4vw,28px)',
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(64px,7vw,96px)',
        lineHeight: 0.7, color: 'var(--brass)', opacity: 0.25, userSelect: 'none',
      }}>
        &ldquo;
      </span>

      {/* Stars */}
      <div aria-label="Five stars" style={{ display: 'flex', gap: 4, color: 'var(--brass)', marginBottom: 'clamp(18px,2.4vw,24px)', position: 'relative', zIndex: 1 }}>
        {Array.from({ length: 5 }).map((_, k) => (
          <span key={k} aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>★</span>
        ))}
      </div>

      <blockquote
        ref={quoteRef}
        style={{
          margin: 0,
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(15px,1.6vw,17.5px)',
          lineHeight: 1.55,
          letterSpacing: '-0.003em',
          color: 'var(--ink)',
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: expanded ? 'block' : '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: expanded ? 'unset' : CLAMP_LINES,
          overflow: 'hidden',
          // Keep every collapsed card the same height (8 lines × 1.55 line-height),
          // so shorter reviews don't shrink their card.
          minHeight: expanded ? undefined : `${CLAMP_LINES * 1.55}em`,
        }}
      >
        {r.quote}
      </blockquote>

      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            alignSelf: 'flex-start',
            marginTop: 'clamp(12px,1.6vw,16px)',
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--sienna)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}

      <figcaption style={{
        marginTop: 'clamp(22px,3vw,32px)',
        paddingTop: 'clamp(16px,2vw,20px)',
        borderTop: '1px solid rgba(31,26,20,0.14)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--script)', fontStyle: 'italic',
            fontSize: 'clamp(22px,2.4vw,26px)', lineHeight: 1,
            color: 'var(--brass)',
          }}>
            {r.name}
          </div>
          <div style={{
            marginTop: 6,
            fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: 'var(--ink-soft)',
          }}>
            {r.stay}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: 'var(--sienna)', whiteSpace: 'nowrap',
        }}>
          · {r.source}
        </div>
      </figcaption>
    </figure>
  )
}
