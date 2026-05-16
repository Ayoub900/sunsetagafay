'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T } from './tokens'
import { Icon, IconName } from './icons'
import { logout } from '@/app/admin/login/actions'
import { useAdminMobile } from './AdminMobileCtx'

type NavItem = [href: string, label: string, icon: IconName, badge?: number]
type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: 'Maison',
    items: [
      ['/admin/dashboard',          'Overview',    'home'],
      ['/admin/reservations',       'Reservations','book'],
      ['/admin/suites',             'Suites',      'bed'],
      ['/admin/restaurants',        'Restaurants', 'fork'],
      ['/admin/guests',             'Guests',      'user'],
      ['/admin/contact-messages',   'Inquiries',   'mail'],
    ],
  },
  {
    label: 'Programming',
    items: [
      ['/admin/experiences',    'Experiences',    'star'],
      ['/admin/events',         'Events',         'calendar'],
      ['/admin/sunset-parties', 'Sunset Parties', 'sun'],
    ],
  },
  {
    label: 'Operations',
    items: [
      ['/admin/transfers',  'Transfers',  'car'],
      ['/admin/treatments', 'Treatments', 'leaf'],
      ['/admin/account',    'Account',    'cog'],
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isMobile, sidebarOpen } = useAdminMobile()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

  return (
    <aside style={{
      position: 'fixed', top: 0, bottom: 0, left: 0, width: 248, zIndex: 40,
      background: T.side,
      borderRight: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column',
      transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 220ms ease',
    }}>
      {/* Brand */}
      <div style={{
        padding: '22px 22px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${T.line}`,
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: T.radiusSm,
          background: T.ink, color: '#F7EFDF',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif, Georgia, serif)', fontSize: 14, fontWeight: 500,
        }}>S</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{
            fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 500, fontSize: 15,
            color: T.ink, letterSpacing: '0.02em',
          }}>Sunset Agafay</div>
          <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 11.5, color: T.ink3 }}>
            Back of house
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {groups.map(g => (
          <div key={g.label} style={{ marginBottom: 22 }}>
            <div style={{
              padding: '6px 12px 8px',
              fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 600,
              color: T.ink3, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{g.label}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map(([href, label, icon, badge]) => {
                const on = isActive(href)
                return (
                  <li key={href}>
                    <Link href={href} style={{
                      width: '100%', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: on ? '9px 12px 9px 16px' : '9px 12px',
                      background: on ? T.surface : 'transparent',
                      border: 0, borderRadius: T.radiusSm,
                      color: on ? T.ink : T.ink2,
                      fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: on ? 600 : 500,
                      textDecoration: 'none',
                      boxShadow: on ? `inset 3px 0 0 ${T.sienna}` : 'none',
                      transition: 'background 180ms, color 180ms',
                    }}>
                      <span style={{ color: on ? T.sienna : T.ink3, display: 'inline-flex', flexShrink: 0 }}>
                        <Icon name={icon} size={17} />
                      </span>
                      <span style={{ flex: 1 }}>{label}</span>
                      {badge != null && (
                        <span style={{
                          minWidth: 22, height: 20, padding: '0 6px', borderRadius: 999,
                          background: T.sienna, color: '#FFF8EE',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 600,
                        }}>{badge}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: 14, borderTop: `1px solid ${T.line}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: T.brass, color: '#FFF8EE',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14,
          flexShrink: 0,
        }}>A</div>
        <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 600,
            color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>Admin</div>
          <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 11.5, color: T.ink3 }}>
            Maître de maison
          </div>
        </div>
        <form action={logout}>
          <button type="submit" title="Sign out" style={{
            width: 30, height: 30,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: `1px solid ${T.line}`,
            borderRadius: T.radiusSm, color: T.ink3, cursor: 'pointer',
            transition: 'background 180ms',
          }}>
            <Icon name="arrowL" size={15} />
          </button>
        </form>
      </div>
    </aside>
  )
}
