import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale, type Locale } from '../../dictionaries'
import { GrainOverlay } from '@/components/shared'

// Never index; shows a clean failure with retry. Exact rejection reasons are
// deliberately NOT shown to the customer (fraud-prevention standard).
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PaymentFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ r?: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const { r: reservationId } = await searchParams

  const dict = await getDictionary(lang as Locale)
  const p = dict.payment

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{ position: 'relative', background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(72px,9vw,120px) var(--gutter) clamp(40px,5vw,64px)', overflow: 'hidden' }}>
        <GrainOverlay opacity={0.14} blend="overlay" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div className="eyebrow no-lead" style={{ color: 'var(--sienna)', marginBottom: 20 }}>{p.failed_eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(34px,6vw,72px)', lineHeight: 0.98, letterSpacing: '-0.02em', margin: 0, color: 'var(--paper)' }}>
            {p.failed_title}
          </h1>
        </div>
      </section>

      <div style={{ padding: 'clamp(40px,6vw,80px) var(--gutter)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)', margin: '0 auto 36px', letterSpacing: '0.02em' }}>
            {p.failed_sub}
          </p>

          {reservationId && (
            <form method="POST" action="/api/payment/initiate" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <input type="hidden" name="reservationId" value={reservationId} />
              <input type="hidden" name="lang" value={lang} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', maxWidth: 420, textAlign: 'left', cursor: 'pointer' }}>
                <input type="checkbox" name="acceptTerms" value="true" required style={{ marginTop: 3 }} />
                <span>
                  {p.terms_prefix}{' '}
                  <Link href={`/${lang}/terms`} style={{ color: 'var(--sienna)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{p.terms_link}</Link>.
                </span>
              </label>
              <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--paper)', background: 'var(--sienna)', border: 'none', padding: '16px 32px', cursor: 'pointer', minWidth: 220, justifyContent: 'center' }}>
                {p.retry_cta}<span aria-hidden="true">→</span>
              </button>
            </form>
          )}

          <div>
            <Link href={`/${lang}/contact`} className="cta" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>
              <span className="cta-label">{p.contact_cta}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
