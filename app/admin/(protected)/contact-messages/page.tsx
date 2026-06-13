import { getContactMessages } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { T } from '@/components/admin/tokens'
import { Icon } from '@/components/admin/icons'
import { markRead, deleteMessage } from './actions'
import { DeleteButton } from './DeleteButton'

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const styles = `
  .inq-list { display: flex; flex-direction: column; gap: 14px; }

  .inq-card {
    border-radius: ${T.radius}px;
    box-shadow: ${T.shadow};
    overflow: hidden;
  }

  .inq-head {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 20px 14px;
  }
  .inq-avatar {
    flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-family: var(--sans, system-ui); font-weight: 600; font-size: 14px;
    background: ${T.brassSoft}; color: ${T.brass};
  }
  .inq-card.unread .inq-avatar { background: ${T.sienna}; color: #FFF8EE; }

  .inq-idblock { flex: 1; min-width: 0; }
  .inq-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .inq-name { font-family: var(--sans, system-ui); font-weight: 600; font-size: 15px; color: ${T.ink}; }
  .inq-badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 999px;
    background: ${T.brassSoft}; color: ${T.brass};
    font-family: var(--sans, system-ui); font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .inq-contact { display: flex; align-items: center; gap: 6px 14px; flex-wrap: wrap; margin-top: 3px; }
  .inq-contact a, .inq-contact span {
    font-family: var(--sans, system-ui); font-size: 13px; color: ${T.ink3};
    text-decoration: none; word-break: break-word;
  }
  .inq-contact a { color: ${T.brass}; }

  .inq-date {
    flex-shrink: 0;
    font-family: var(--sans, system-ui); font-size: 12px; color: ${T.ink3};
    white-space: nowrap; padding-top: 3px;
  }

  .inq-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px 4px; }
  .inq-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 999px;
    background: ${T.surfaceAlt}; border: 1px solid ${T.line};
    font-family: var(--sans, system-ui); font-size: 12px; color: ${T.ink2};
    max-width: 100%;
  }
  .inq-chip.subject { background: ${T.siennaSoft}; border-color: rgba(160,74,42,0.18); color: ${T.sienna}; font-weight: 500; }
  .inq-chip svg { flex-shrink: 0; color: ${T.ink3}; }

  .inq-body {
    margin: 12px 20px 0;
    padding: 14px 16px;
    background: ${T.bg};
    border: 1px solid ${T.line};
    border-radius: ${T.radiusSm}px;
    font-family: var(--sans, system-ui); font-size: 13.5px; line-height: 1.65; color: ${T.ink2};
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .inq-actions {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 20px 18px;
  }
  .inq-actions form { display: contents; }
  .inq-btn {
    padding: 8px 14px; border-radius: ${T.radiusSm}px;
    font-family: var(--sans, system-ui); font-size: 13px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
  }
  .inq-btn.read { background: ${T.okSoft}; color: #3F6238; border: 1px solid rgba(94,140,87,0.3); }
  .inq-btn.unread-toggle { background: ${T.surface}; color: ${T.ink3}; border: 1px solid ${T.line2}; }

  @media (max-width: 560px) {
    .inq-head { flex-wrap: wrap; }
    .inq-date { width: 100%; padding-top: 6px; padding-left: 54px; }
    .inq-actions { flex-direction: column-reverse; }
    .inq-actions .inq-btn { width: 100%; }
  }
`

export default async function ContactMessagesPage() {
  const messages = await getContactMessages()
  const unread = messages.filter(m => !m.read).length

  return (
    <>
      <style>{styles}</style>
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
          <div className="inq-list">
            {messages.map(m => (
              <div
                key={m.id}
                className={`inq-card${m.read ? '' : ' unread'}`}
                style={{
                  background: m.read ? T.surface : '#FFFDF5',
                  border: `1px solid ${m.read ? T.line : 'rgba(184,137,58,0.35)'}`,
                }}
              >
                {/* Header: sender identity + timestamp */}
                <div className="inq-head">
                  <span className="inq-avatar">{initials(m.name)}</span>
                  <div className="inq-idblock">
                    <div className="inq-name-row">
                      <span className="inq-name">{m.name}</span>
                      {!m.read && <span className="inq-badge">New</span>}
                    </div>
                    <div className="inq-contact">
                      <a href={`mailto:${m.email}`}>{m.email}</a>
                      {m.phone && <a href={`tel:${m.phone}`}>{m.phone}</a>}
                    </div>
                  </div>
                  <div className="inq-date">{formatDate(m.createdAt)}</div>
                </div>

                {/* Meta chips */}
                <div className="inq-chips">
                  {m.subject && (
                    <span className="inq-chip subject">{m.subject}</span>
                  )}
                  {m.table && (
                    <span className="inq-chip"><Icon name="fork" size={13} />Table {m.table}</span>
                  )}
                  {m.checkin && (
                    <span className="inq-chip">
                      <Icon name="calendar" size={13} />
                      {m.checkin}{m.checkout && ` → ${m.checkout}`}
                    </span>
                  )}
                  {m.guests && (
                    <span className="inq-chip"><Icon name="user" size={13} />{m.guests} guests</span>
                  )}
                </div>

                {/* Message body */}
                <div className="inq-body">{m.message}</div>

                {/* Actions */}
                <div className="inq-actions">
                  <form action={markRead.bind(null, m.id, !m.read)}>
                    <button type="submit" className={`inq-btn ${m.read ? 'unread-toggle' : 'read'}`}>
                      {m.read ? 'Mark unread' : '✓ Mark read'}
                    </button>
                  </form>
                  <form action={deleteMessage.bind(null, m.id)}>
                    <DeleteButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
