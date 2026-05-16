import Link from 'next/link'

// Note: Next.js calls not-found.tsx without params, so lang is not available.
// We default to English; the proxy.ts will have already set the locale.

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--gutter)',
        background: 'var(--paper)',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--sienna)',
          marginBottom: 28,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 'clamp(36px,5vw,64px)',
          lineHeight: 1,
          letterSpacing: '-0.018em',
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        This room doesn&apos;t exist.
      </h1>
      <p
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(16px,1.8vw,20px)',
          color: 'var(--sienna)',
          margin: 'clamp(16px,2vw,28px) 0 0',
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        Perhaps it was never built, or perhaps you have arrived too early.
      </p>
      <div style={{ marginTop: 'clamp(28px,4vw,44px)' }}>
        <Link href="/en" className="cta">
          <span className="cta-label">Return to the Maison</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
