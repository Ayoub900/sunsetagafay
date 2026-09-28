import { getActivePopups } from '@/lib/db'
import { resolvePopupHref } from './PopupCard'
import { SitePopup, type SitePopupData } from './SitePopup'

// Date windows are checked on the client: this runs inside the (static,
// revalidated-on-save) locale layout, so "today" here would be stale. Popups
// whose window has already closed are dropped here to keep the payload small.
export async function SitePopupServer({ lang }: { lang: 'en' | 'fr' }) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = (await getActivePopups()).filter(p => !p.endDate || p.endDate >= today)
  if (!rows.length) return null

  const fr = lang === 'fr'
  const popups: SitePopupData[] = rows.map(p => {
    const { href, external } = resolvePopupHref(p.ctaUrl, lang)
    return {
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      delaySeconds: p.delaySeconds,
      frequency: p.frequency,
      showOn: p.showOn,
      content: {
        eyebrow:     (fr ? p.eyebrowFr : p.eyebrowEn) || p.eyebrowEn,
        title:       (fr ? p.titleFr : p.titleEn) || p.titleEn,
        description: (fr ? p.descriptionFr : p.descriptionEn) || p.descriptionEn,
        offer:       (fr ? p.offerFr : p.offerEn) || p.offerEn,
        ctaLabel:    (fr ? p.ctaLabelFr : p.ctaLabelEn) || p.ctaLabelEn,
        ctaHref:     href,
        external,
        imageUrl:    p.imageUrl,
      },
    }
  })
  return <SitePopup popups={popups} lang={lang} />
}
