import Link from 'next/link'
import { getDashboardCounts, getSuites, getReservations } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { StatCard } from '@/components/admin/StatCard'
import { PageHead } from '@/components/admin/PageHead'
import { StatusPill } from '@/components/admin/Pill'
import { T } from '@/components/admin/tokens'
import { SeedButton } from './SeedButton'

const sections = [
  { key: 'suites',       label: 'Suites',         href: '/admin/suites' },
  { key: 'restaurants',  label: 'Restaurants',     href: '/admin/restaurants' },
  { key: 'experiences',  label: 'Experiences',     href: '/admin/experiences' },
  { key: 'events',       label: 'Events',          href: '/admin/events' },
  { key: 'parties',      label: 'Sunset Parties',  href: '/admin/sunset-parties' },
  { key: 'transfers',    label: 'Transfers',       href: '/admin/transfers' },
  { key: 'treatments',   label: 'Treatments',      href: '/admin/treatments' },
  { key: 'reservations', label: 'Reservations',    href: '/admin/reservations' },
  { key: 'guests',       label: 'Guests',          href: '/admin/guests' },
] as const

export default async function DashboardPage() {
  const [counts, suites, reservations] = await Promise.all([
    getDashboardCounts(),
    getSuites(),
    getReservations(),
  ])

  const isEmpty = counts.suites === 0 && counts.restaurants === 0

  const recentReservations = reservations.slice(0, 5)

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .dash-wrap { padding: 8px 16px 32px !important; }
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-res-row { grid-template-columns: 1fr auto !important; }
          .dash-res-date, .dash-res-total { display: none !important; }
        }
        @media (max-width: 768px) {
          .dash-content-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <AdminTopbar crumbs={['Maison', 'Overview']} />
      <PageHead
        title="Good morning."
        lede={`${counts.suites} suites on file · ${counts.reservations} reservations · ${counts.guests} guests registered.`}
      />

      <div className="dash-wrap" style={{ padding: '8px 32px 48px' }}>

        {/* Seed banner */}
        {isEmpty && (
          <div style={{
            background: T.siennaSoft,
            border: `1px solid rgba(160,74,42,0.2)`,
            borderRadius: T.radius, padding: '20px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                Database is empty
              </div>
              <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2 }}>
                Populate all sections with the built-in EN/FR seed content.
              </div>
            </div>
            <SeedButton />
          </div>
        )}

        {/* Stat cards */}
        <div className="dash-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard
            icon="bed"
            label="Suites"
            value={counts.suites}
            foot="Active rooms on the site"
          />
          <StatCard
            icon="book"
            label="Reservations"
            value={counts.reservations}
            deltaTone="brass"
            foot="All bookings on file"
          />
          <StatCard
            icon="user"
            label="Guests"
            value={counts.guests}
            foot="Registered guest profiles"
          />
          <StatCard
            icon="star"
            label="Experiences"
            value={counts.experiences}
            foot={`+ ${counts.treatments} treatments`}
          />
        </div>

        {/* Content grid */}
        <div className="dash-content-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

          {/* Recent reservations */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12,
            }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 15, color: T.ink }}>
                Recent reservations
              </h2>
              <Link href="/admin/reservations" style={{
                fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 500,
                color: T.sienna, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}>View all →</Link>
            </div>

            <div style={{
              background: T.surface, border: `1px solid ${T.line}`,
              borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden',
            }}>
              {recentReservations.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: T.ink3 }}>
                  No reservations yet —{' '}
                  <Link href="/admin/reservations?new=1" style={{ color: T.sienna, textDecoration: 'none' }}>add the first one</Link>
                </div>
              ) : recentReservations.map((r, i) => (
                <div key={r.id} className="dash-res-row" style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto',
                  columnGap: 20,
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < recentReservations.length - 1 ? `1px solid ${T.line}` : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 13.5, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.guestName}</div>
                    <div style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, color: T.ink3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.suite}</div>
                  </div>
                  <div className="dash-res-date" style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink2, whiteSpace: 'nowrap' }}>
                    {r.checkIn} → {r.checkOut}
                  </div>
                  <div className="dash-res-total" style={{ fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 13.5, color: T.ink }}>
                    {r.total || `${r.nights}n`}
                  </div>
                  <div><StatusPill v={r.status} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Content overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: T.surface, border: `1px solid ${T.line}`,
              borderRadius: T.radius, boxShadow: T.shadow, padding: 20,
            }}>
              <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 15, color: T.ink }}>
                Content
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sections.filter(s => !['reservations','guests'].includes(s.key)).map(s => (
                  <Link key={s.key} href={s.href} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: T.radiusSm,
                    background: 'transparent', textDecoration: 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14, fontWeight: 500, color: T.ink }}>
                      {s.label}
                    </span>
                    <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 20, color: T.sienna }}>
                      {counts[s.key as keyof typeof counts]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Suites preview */}
            {suites.length > 0 && (
              <div style={{
                background: T.surface, border: `1px solid ${T.line}`,
                borderRadius: T.radius, boxShadow: T.shadow, padding: 20,
              }}>
                <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 15, color: T.ink }}>
                  Suites at a glance
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suites.slice(0, 5).map(s => (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: `1px solid ${T.line}`,
                    }}>
                      <div>
                        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, fontWeight: 500, color: T.ink }}>{s.nameEn}</span>
                        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3, marginLeft: 8 }}>{s.area}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, fontWeight: 600, color: T.sienna }}>
                        {s.rate}
                      </span>
                    </div>
                  ))}
                </div>
                {suites.length > 5 && (
                  <Link href="/admin/suites" style={{
                    display: 'block', marginTop: 12,
                    fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.sienna, textDecoration: 'none',
                  }}>
                    + {suites.length - 5} more suites →
                  </Link>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
