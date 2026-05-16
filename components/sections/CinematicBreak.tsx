import { GrainOverlay } from '../shared'

interface CinematicDict { eyebrow: string; quote: string; attribution: string }

export function CinematicBreak({ dict }: { dict: CinematicDict }) {
  return (
    <section
      className="photo-sunset"
      style={{
        position: 'relative', width: '100%',
        minHeight: 'clamp(500px,65vw,92vh)',
        overflow: 'hidden',
        color: 'var(--paper)',
      }}
    >

      <div className="halation" aria-hidden="true" style={{ zIndex: 1 }} />
      <GrainOverlay opacity={0.45} blend="overlay" style={{ zIndex: 2 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(20,12,8,0.42), transparent 30%, transparent 70%, rgba(20,12,8,0.52))' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'grid', placeItems: 'center', padding: 'clamp(80px,10vw,120px) var(--gutter)', textAlign: 'center' }}>
        <blockquote cite="https://www.cntraveller.com" style={{ maxWidth: 980, margin: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 'clamp(20px,3vw,36px)', opacity: 0.85, justifyContent: 'center' }}>
            {dict.eyebrow}
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(24px,4vw,56px)', lineHeight: 1.25, letterSpacing: '-0.012em', margin: 0 }}>
            &ldquo;{dict.quote}&rdquo;
          </p>
          <footer style={{ marginTop: 'clamp(24px,3vw,44px)', display: 'inline-flex', alignItems: 'center', gap: 18, fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.88 }}>
            <span aria-hidden="true" style={{ width: 36, height: 1, background: 'currentColor', opacity: 0.5 }} />
            <cite style={{ fontStyle: 'normal' }}>{dict.attribution}</cite>
            <span aria-hidden="true" style={{ width: 36, height: 1, background: 'currentColor', opacity: 0.5 }} />
          </footer>
        </blockquote>
      </div>
    </section>
  )
}
