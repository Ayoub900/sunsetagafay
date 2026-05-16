import { T } from './tokens'

interface PageHeadProps {
  title: string
  lede?: string
  action?: React.ReactNode
}

export function PageHead({ title, lede, action }: PageHeadProps) {
  return (
    <>
    <style>{`
      @media (max-width: 640px) {
        .page-head { padding: 20px 16px 16px !important; }
        .page-head-title { font-size: 26px !important; }
      }
    `}</style>
    <div className="page-head" style={{
      padding: '28px 32px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24,
    }}>
      <div>
        <h1 className="page-head-title" style={{
          margin: 0,
          fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 400,
          fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.018em',
          color: T.ink,
        }}>{title}</h1>
        {lede && (
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'var(--sans, system-ui)', fontSize: 14.5, lineHeight: 1.5,
            color: T.ink2, maxWidth: 720,
          }}>{lede}</p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
    </>
  )
}
