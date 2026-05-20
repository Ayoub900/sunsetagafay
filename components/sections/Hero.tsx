import { GrainOverlay } from '../shared'
import Link from 'next/link'

interface HeroDict {
  eyebrow: string; headline: string; headline_2?: string; subline: string
  cta_reserve: string; cta_story: string; scroll: string
}

export function HeroCourtyard({ dict, lang }: { dict: HeroDict; lang: string }) {
  return (
    <section
      aria-label={dict.headline}
      className="photo-sunset"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        minHeight: 680,
        overflow: 'hidden',
        color: 'var(--paper)',
      }}
    >

      <div className="halation" aria-hidden="true" style={{ zIndex: 1 }} />
      <GrainOverlay opacity={0.48} blend="overlay" style={{ zIndex: 2 }} />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(20,12,8,0.52) 0%, transparent 26%, transparent 50%, rgba(20,12,8,0.78) 100%)',
        }}
      />

      {/* Bottom lockup */}
      <div style={{
        position: 'absolute',
        left: 'var(--gutter)', right: 'var(--gutter)', bottom: 'clamp(40px,6vw,60px)',
        zIndex: 4, color: 'var(--paper)',
      }}>
        <div className="hero-bottom-grid">
          <div>
            <div className="eyebrow no-lead" style={{ opacity: 0.85, marginBottom: 'clamp(16px,2.5vw,26px)' }}>
              {dict.eyebrow}
            </div>
            <h1 style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 'clamp(52px,8vw,104px)',
              lineHeight: 0.94,
              letterSpacing: '-0.024em',
              margin: 0,
            }}>
              {dict.headline}
            </h1>
            {dict.headline_2 && (
              <div style={{
                fontFamily: 'var(--script)',
                fontStyle: 'italic',
                fontSize: 'clamp(20px,2.4vw,30px)',
                lineHeight: 1.15,
                letterSpacing: '0',
                marginTop: 'clamp(10px,1.4vw,18px)',
                color: 'var(--brass)',
                opacity: 0.95,
              }}>
                {dict.headline_2}
              </div>
            )}
          </div>
          <div className="hero-right-col" style={{ paddingBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            <p style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(16px,1.8vw,19px)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 440,
              opacity: 0.9,
            }}>
              {dict.subline}
            </p>
            <div style={{ display: 'flex', gap: 'clamp(20px,3vw,36px)', alignItems: 'center', marginTop: 'clamp(20px,3vw,28px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Link href={`/${lang}/reserve`} className="cta">
                <span className="cta-label">{dict.cta_reserve}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href={`/${lang}#story`} className="cta" style={{ opacity: 0.8 }}>
                <span className="cta-label">{dict.cta_story}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, color: 'var(--paper)', opacity: 0.6,
          fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ display: 'inline-block', width: 16, height: 1, background: 'currentColor' }} />
        {dict.scroll}
        <span style={{ display: 'inline-block', width: 16, height: 1, background: 'currentColor' }} />
      </div>
    </section>
  )
}
