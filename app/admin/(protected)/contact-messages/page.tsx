import { getContactMessages } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { T } from '@/components/admin/tokens'
import { markRead, deleteMessage } from './actions'
import { DeleteButton } from './DeleteButton'

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

export default async function ContactMessagesPage() {
  const messages = await getContactMessages()
  const unread = messages.filter(m => !m.read).length

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Inquiries']} />
      <PageHead
        title="Inquiries"
        lede={`${messages.length} total · ${unread} unread`}
      />

      <div style={{ padding: '8px 32px 48px' }}>
        {messages.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: T.ink3 }}>
            No inquiries yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => (
              <div key={m.id} style={{
                background: m.read ? T.surface : '#FFFDF5',
                border: `1px solid ${m.read ? T.line : 'rgba(184,137,58,0.35)'}`,
                borderRadius: T.radius,
                boxShadow: T.shadow,
                padding: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  {/* Left: sender info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {!m.read && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '2px 9px', borderRadius: 999,
                          background: T.brassSoft, color: T.brass,
                          fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 600,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>New</span>
                      )}
                      <span style={{ fontFamily: 'var(--sans, system-ui)', fontWeight: 600, fontSize: 14.5, color: T.ink }}>
                        {m.name}
                      </span>
                      <a href={`mailto:${m.email}`} style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.brass, textDecoration: 'none' }}>
                        {m.email}
                      </a>
                      {m.phone && (
                        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 13, color: T.ink3 }}>{m.phone}</span>
                      )}
                    </div>

                    <div style={{ marginTop: 6, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.sienna, fontWeight: 500 }}>
                        {m.subject}
                      </span>
                      {m.table && (
                        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3 }}>
                          Table: {m.table}
                        </span>
                      )}
                      {m.checkin && (
                        <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3 }}>
                          {m.checkin} → {m.checkout}
                          {m.guests && ` · ${m.guests} guests`}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 12, color: T.ink3 }}>
                        {formatDate(m.createdAt)}
                      </span>
                    </div>

                    <p style={{ margin: '12px 0 0', fontFamily: 'var(--sans, system-ui)', fontSize: 13.5, color: T.ink2, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                      {m.message}
                    </p>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <form action={markRead.bind(null, m.id, !m.read)}>
                      <button type="submit" style={{
                        padding: '7px 12px',
                        background: m.read ? T.surface : T.okSoft,
                        color: m.read ? T.ink3 : '#3F6238',
                        border: `1px solid ${m.read ? T.line2 : 'rgba(94,140,87,0.3)'}`,
                        borderRadius: T.radiusSm,
                        fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: 500,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>
                        {m.read ? 'Mark unread' : '✓ Mark read'}
                      </button>
                    </form>
                    <form action={deleteMessage.bind(null, m.id)}>
                      <DeleteButton />
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
