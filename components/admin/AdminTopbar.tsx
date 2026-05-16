'use client'

import { T } from './tokens'
import { Icon } from './icons'
import { useAdminMobile } from './AdminMobileCtx'

interface Props {
  crumbs: string[]
  action?: React.ReactNode
}

export function AdminTopbar({ crumbs, action }: Props) {
  const { isMobile, setSidebarOpen } = useAdminMobile()

  return (
    <header className="admin-topbar" style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(247,241,228,0.92)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${T.line}`,
      padding: isMobile ? '10px 12px' : '12px 16px 12px 32px',
      display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20,
      minWidth: 0,
    }}>
      <style>{`
        @media (max-width: 480px) {
          .admin-topbar .topbar-crumbs { font-size: 12px !important; gap: 4px !important; }
          .admin-topbar .topbar-crumbs > span { gap: 4px !important; }
          .admin-topbar .topbar-action a,
          .admin-topbar .topbar-action button {
            font-size: 12.5px !important; padding: 7px 10px !important; height: auto !important;
          }
        }
      `}</style>
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, flexShrink: 0,
            background: 'transparent', border: `1px solid ${T.line}`,
            borderRadius: 6, cursor: 'pointer', color: T.ink,
          }}
        >
          <Icon name="menu" size={18} />
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="topbar-crumbs" style={{
        flex: 1, minWidth: 0, overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3,
        whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              color: i === crumbs.length - 1 ? T.ink : T.ink3,
              fontWeight: i === crumbs.length - 1 ? 600 : 500,
            }}>{c}</span>
            {i < crumbs.length - 1 && (
              <span style={{ color: T.line2, fontSize: 15 }}>/</span>
            )}
          </span>
        ))}
      </div>

      {/* Search */}
      <div style={{
        display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10,
        padding: '0 12px',
        background: T.surface,
        border: `1px solid ${T.line2}`,
        borderRadius: T.radiusSm,
        height: 36, width: 280,
      }}>
        <span style={{ color: T.ink3, display: 'inline-flex', flexShrink: 0 }}>
          <Icon name="search" size={15} />
        </span>
        <input
          placeholder="Search…"
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink,
          }}
        />
        <span style={{
          fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 600,
          color: T.ink3, padding: '2px 5px',
          background: T.surfaceAlt, borderRadius: 4,
        }}>⌘K</span>
      </div>

      {/* Actions */}
      <div className="topbar-action" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {action}
      </div>
    </header>
  )
}
