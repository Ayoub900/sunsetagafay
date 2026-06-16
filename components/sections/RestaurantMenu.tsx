import { GrainOverlay } from '../shared'

interface MenuItem { name: string; desc?: string; price?: string }
interface MenuGroup { title: string; items: MenuItem[] }
export interface RestaurantMenuDict {
  eyebrow: string
  title: string
  lede: string
  tagline: string
  currency: string
  groups: MenuGroup[]
}

// Shared resort menu, rendered on every restaurant detail page.
export function RestaurantMenu({ dict }: { dict: RestaurantMenuDict }) {
  return (
    <section style={{ position: 'relative', background: 'var(--paper-deep)', padding: 'clamp(64px,9vw,110px) var(--gutter)' }}>
      <GrainOverlay opacity={0.14} blend="multiply" />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,72px)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(15px,2vw,19px)', color: 'var(--sienna)', marginBottom: 10 }}>
            {dict.eyebrow}
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(34px,5vw,60px)', lineHeight: 0.98, letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)' }}>
            {dict.title}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.7, color: 'var(--ink-soft)', margin: '16px auto 0', maxWidth: 560 }}>
            {dict.lede}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px), 1fr))', gap: 'clamp(36px,5vw,64px)', alignItems: 'start' }}>
          {dict.groups.map(group => (
            <div key={group.title} style={{ breakInside: 'avoid' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--brass)', margin: '0 0 18px' }}>
                <span>{group.title}</span>
                <span aria-hidden="true" style={{ flex: 1, height: 1, background: 'rgba(184,137,58,0.45)' }} />
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {group.items.map(item => (
                  <li key={item.name}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(15px,1.7vw,17px)', color: 'var(--ink)' }}>{item.name}</span>
                      {item.price && (
                        <>
                          <span aria-hidden="true" style={{ flex: 1, borderBottom: '1px dotted rgba(31,26,20,0.3)', transform: 'translateY(-4px)' }} />
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(15px,1.7vw,17px)', color: 'var(--sienna)', whiteSpace: 'nowrap' }}>{item.price} {dict.currency}</span>
                        </>
                      )}
                    </div>
                    {item.desc && (
                      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(12px,1.3vw,13.5px)', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '3px 0 0' }}>
                        {item.desc}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.6vw,17px)', color: 'var(--sienna)', textAlign: 'center', margin: 'clamp(44px,6vw,72px) auto 0', maxWidth: 480 }}>
          {dict.tagline}
        </p>
      </div>
    </section>
  )
}
