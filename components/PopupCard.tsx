import Link from 'next/link'

export type PopupContent = {
  eyebrow: string
  title: string
  description: string
  offer: string
  ctaLabel: string
  ctaHref: string
  external: boolean
  imageUrl: string
}

// Pure markup for a marketing popup; styles live in globals.css (.sa-popup*).
// Shared by the public SitePopup and the admin live preview.
export function PopupCard({
  content, closeLabel, onClose, titleId,
}: {
  content: PopupContent
  closeLabel: string
  onClose?: () => void
  titleId?: string
}) {
  const { eyebrow, title, description, offer, ctaLabel, ctaHref, external, imageUrl } = content
  return (
    <div className={`sa-popup-card${imageUrl ? ' has-image' : ''}`}>
      <button type="button" className="sa-popup-close" aria-label={closeLabel} onClick={onClose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      {imageUrl && (
        <div className="sa-popup-media">
          <img src={imageUrl} alt="" />
        </div>
      )}
      <div className="sa-popup-body">
        {eyebrow && <p className="sa-popup-eyebrow">{eyebrow}</p>}
        <h2 id={titleId} className="sa-popup-title">{title}</h2>
        {offer && <p className="sa-popup-offer">{offer}</p>}
        {description && <p className="sa-popup-desc">{description}</p>}
        {ctaLabel && ctaHref && (external ? (
          <a className="sa-popup-cta" href={ctaHref} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            {ctaLabel}
          </a>
        ) : (
          <Link className="sa-popup-cta" href={ctaHref} onClick={onClose}>
            {ctaLabel}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Site-relative paths get the visitor's locale prefixed unless they already
// carry one; absolute URLs are left alone and open in a new tab.
export function resolvePopupHref(url: string, lang: string): { href: string; external: boolean } {
  if (!url) return { href: '', external: false }
  if (/^https?:\/\//i.test(url)) return { href: url, external: true }
  if (/^\/(en|fr)(\/|$|\?|#)/.test(url)) return { href: url, external: false }
  return { href: `/${lang}${url === '/' ? '' : url}`, external: false }
}
