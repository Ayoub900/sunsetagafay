import Link from 'next/link'
import { GrainOverlay, SunburstMark } from './shared'
import { NewsletterForm } from './NewsletterForm'

interface FooterLink { label: string; href: string }

interface FooterDict {
  reserve_eyebrow: string; reserve_h1: string; reserve_script: string
  arrival: string; arrival_val: string
  departure: string; departure_val: string
  guests: string; guests_val: string
  room_label: string; room_val: string
  confirm: string; concierge: string
  maison_label: string; maison_links: FooterLink[]
  practical_label: string; practical_links: FooterLink[]
  bulletin_label: string; bulletin_text: string
  email_placeholder: string; email_label: string; subscribe: string
  legal: string; privacy: string; terms: string; instagram: string
}

interface FooterProps { dict: FooterDict; lang: string }

const base = (lang: string) => `/${lang}`

export function Footer({ dict, lang }: FooterProps) {
  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(80px,10vw,120px) var(--gutter) clamp(48px,6vw,56px)', position: 'relative' }}>
      <GrainOverlay opacity={0.18} blend="overlay" style={{ zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div className="footer-grid">

          {/* Reservation panel */}
          <div>
            <div className="eyebrow no-lead" style={{ color: 'var(--rose)', marginBottom: 28 }}>
              {dict.reserve_eyebrow}
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(48px,6vw,80px)', lineHeight: 0.96, letterSpacing: '-0.022em', margin: 0 }}>
              {dict.reserve_h1}<br />
              <span style={{ fontFamily: 'var(--script)', fontStyle: 'italic', fontSize: '0.95em', color: 'var(--brass)', lineHeight: 0.7 }}>
                {dict.reserve_script}
              </span>
            </h2>

            {/* Booking strip */}
            <div className="footer-booking" style={{ marginTop: 48, border: '1px solid rgba(242,232,213,0.22)', padding: 'clamp(16px,2vw,28px)' }}>
              {([
                [dict.arrival,    dict.arrival_val],
                [dict.departure,  dict.departure_val],
                [dict.guests,     dict.guests_val],
                [dict.room_label, dict.room_val],
              ] as [string, string][]).map(([k, v], i, a) => (
                <div key={k} style={{ padding: '6px clamp(12px,2vw,24px)', borderRight: i < a.length - 1 ? '1px solid rgba(242,232,213,0.18)' : '0' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.6)', marginBottom: 10 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(14px,1.5vw,18px)', color: 'var(--paper)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <Link href={`${base(lang)}/contact`} className="cta">
                <span className="cta-label">{dict.confirm}</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href={`${base(lang)}/contact`} className="cta" style={{ opacity: 0.78 }}>
                <span className="cta-label">{dict.concierge}</span>
              </Link>
            </div>
          </div>

          {/* Sitemap + newsletter */}
          <div>
            <div className="footer-sitemap" style={{ fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 2, color: 'rgba(242,232,213,0.78)' }}>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 14 }}>
                  {dict.maison_label}
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {dict.maison_links.map(l => (
                    <li key={l.label}>
                      <Link
                        href={l.href.startsWith('#') ? `${base(lang)}${l.href}` : `${base(lang)}/${l.href}`}
                        className="footer-link"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 14 }}>
                  {dict.practical_label}
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {dict.practical_links.map(l => (
                    <li key={l.label}>
                      <Link
                        href={`${base(lang)}/${l.href}`}
                        className="footer-link"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter */}
            <div style={{ marginTop: 48, borderTop: '1px solid rgba(242,232,213,0.18)', paddingTop: 32 }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 14 }}>
                {dict.bulletin_label}
              </div>
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(16px,1.8vw,18px)', lineHeight: 1.5, margin: '0 0 22px', color: 'rgba(242,232,213,0.85)', maxWidth: 380 }}>
                {dict.bulletin_text}
              </p>
              <NewsletterForm
                placeholder={dict.email_placeholder}
                label={dict.email_label}
                subscribe={dict.subscribe}
              />
            </div>
          </div>
        </div>

        {/* Legal row */}
        <div className="footer-legal" style={{ marginTop: 'clamp(48px,7vw,96px)', paddingTop: 28, borderTop: '1px solid rgba(242,232,213,0.18)' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.55)' }}>
            {dict.legal}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 14, letterSpacing: '0.42em', textTransform: 'uppercase', justifySelf: 'center' }}>
            <SunburstMark size={14} stroke={0.9} color="var(--paper)" />
            Sunset Agafay
          </div>
          <div style={{ justifySelf: 'end', fontFamily: 'var(--sans)', fontSize: 10.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(242,232,213,0.55)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href={`${base(lang)}/privacy`} className="footer-link">{dict.privacy}</Link>
            <Link href={`${base(lang)}/terms`} className="footer-link">{dict.terms}</Link>
            <a href="https://www.instagram.com/sunsetagafay" target="_blank" rel="noopener noreferrer" className="footer-link">{dict.instagram}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
