const BASE = 'https://sunsetagafay.com'

export function buildAlternates(lang: string, path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return {
    canonical: `${BASE}/${lang}${cleanPath}`,
    languages: {
      en: `${BASE}/en${cleanPath}`,
      fr: `${BASE}/fr${cleanPath}`,
      'x-default': `${BASE}${cleanPath}`,
    },
  }
}

interface BreadcrumbItem {
  name: string
  href: string
}

export function buildBreadcrumbSchema(lang: string, items: BreadcrumbItem[]) {
  const allItems = [
    { name: lang === 'fr' ? 'Accueil' : 'Home', href: `${BASE}/${lang}` },
    ...items.map(i => ({ name: i.name, href: i.href.startsWith('http') ? i.href : `${BASE}${i.href}` })),
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href,
    })),
  }
}
