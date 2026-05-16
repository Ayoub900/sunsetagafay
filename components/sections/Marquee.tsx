interface MarqueeDict { items: string[] }

export function Marquee({ dict }: { dict: MarqueeDict }) {
  const row = [...dict.items, ...dict.items, ...dict.items]
  return (
    <section
      aria-hidden="true"
      style={{
        background: 'var(--paper)',
        borderTop: '1px solid rgba(31,26,20,0.14)',
        borderBottom: '1px solid rgba(31,26,20,0.14)',
        overflow: 'hidden',
        padding: '20px 0',
      }}
    >
      <div
        data-marquee
        style={{
          display: 'flex',
          gap: 60,
          whiteSpace: 'nowrap',
          animation: 'marquee 60s linear infinite',
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(18px,2vw,22px)',
          color: 'var(--sienna)',
        }}
      >
        {row.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>
            {t}
            <span
              aria-hidden="true"
              style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: 'var(--brass)', opacity: 0.7 }}
            />
          </span>
        ))}
      </div>
    </section>
  )
}
