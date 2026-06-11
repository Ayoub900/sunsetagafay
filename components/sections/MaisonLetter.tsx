import { GrainOverlay, Photo } from '../shared'

interface StoryDict {
  eyebrow: string
  headline_1: string; headline_script: string; headline_2: string
  p1: string; p2: string
  founders: string; founders_role: string
  fact_locale: string; fact_locale_val: string
  fact_distance: string; fact_distance_val: string
  fact_rooms: string; fact_rooms_val: string
  fact_saison: string; fact_saison_val: string
}

export function MaisonLetter({ dict }: { dict: StoryDict }) {
  const facts = [
    [dict.fact_locale,   dict.fact_locale_val],
    [dict.fact_distance, dict.fact_distance_val],
    [dict.fact_rooms,    dict.fact_rooms_val],
    [dict.fact_saison,   dict.fact_saison_val],
  ] as [string, string][]

  return (
    <section id="story" style={{ background: 'var(--paper)', padding: 'clamp(80px,10vw,140px) var(--gutter)', position: 'relative', scrollMarginTop: 'var(--nav-h)' }}>
      <GrainOverlay opacity={0.1} blend="multiply" style={{ zIndex: 1 }} />
      <div className="story-grid container" style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto', padding: 0 }}>

        {/* Left — letter */}
        <div>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 'clamp(24px,3vw,36px)' }}>
            {dict.eyebrow}
          </div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 400,
            fontSize: 'clamp(36px,5.5vw,72px)', lineHeight: 0.98,
            letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)',
          }}>
            {dict.headline_1}
            <span style={{
              fontFamily: 'var(--script)', fontStyle: 'italic',
              color: 'var(--brass)',
            }}>
              {' '}{dict.headline_script}{' '}
            </span>
            {dict.headline_2}
          </h2>

          <div className="story-body" style={{ marginTop: 'clamp(32px,4vw,56px)', color: 'var(--ink-soft)', fontFamily: 'var(--sans)', fontSize: 'clamp(14px,1.4vw,14.5px)', lineHeight: 1.75 }}>
            <p style={{ margin: 0 }}>{dict.p1}</p>
            <p style={{ margin: 0 }}>{dict.p2}</p>
          </div>

          <div style={{ marginTop: 'clamp(32px,4vw,56px)', display: 'flex', alignItems: 'baseline', gap: 'clamp(16px,2vw,28px)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--script)', fontStyle: 'italic', fontSize: 'clamp(40px,4vw,56px)', lineHeight: 0.7, color: 'var(--brass)' }}>
              {dict.founders}
            </span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              {dict.founders_role}
            </span>
          </div>
        </div>

        {/* Right — framed image + facts */}
        <div className="story-media">
          <div className="story-photo" style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
            <Photo
              kind="courtyard"
              src="/aerial-sunset-pool.webp"
              alt="The Olive Court — Sunset Agafay"
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>

          <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: 0, borderTop: '1px solid rgba(31,26,20,0.18)', color: 'var(--ink-soft)', fontFamily: 'var(--sans)', fontSize: 12.5 }}>
            {facts.map(([k, v]) => (
              <li key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(31,26,20,0.12)' }}>
                <span style={{ letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: 10.5 }}>{k}</span>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
