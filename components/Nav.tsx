'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface NavDict {
  story: string
  suites: string; suites_all: string
  restaurants: string; restaurants_all: string
  events: string; events_all: string
  sunset_parties: string; sunset_parties_all: string
  day_pass: string; day_pass_all: string; day_pass_hot?: string
  transfers: string; transfers_all: string
  experiences: string
  contact: string
  reserve: string
  menu_open: string
  menu_close: string
}

export interface NavDropdownItem { slug: string; label: string }

export interface NavItems {
  suites: NavDropdownItem[]
  restaurants: NavDropdownItem[]
  events: NavDropdownItem[]
  parties: NavDropdownItem[]
  partiesEnabled: boolean
  dayPasses: NavDropdownItem[]
  transfers: NavDropdownItem[]
}

interface NavProps {
  dict: NavDict
  lang: string
  items: NavItems
}

const base = (lang: string) => `/${lang}`

export function Nav({ dict, lang, items }: NavProps) {
  const [scrolled,       setScrolled]       = useState(false)
  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const router = useRouter()
  const mobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [router])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const tone    = scrolled ? 'scrolled' : 'top'

  const toggleMobile = (key: string) =>
    setMobileExpanded(prev => (prev === key ? null : key))

  const renderDesktopDropdown = (
    key: string,
    label: string,
    section: 'suites' | 'restaurants' | 'events' | 'sunset-parties' | 'day-pass' | 'transfers',
    allLabel: string,
    list: NavDropdownItem[],
    badge?: string,
  ) => (
    <li className="nav-item" role="none">
      <button
        className="nav-link"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls={`dropdown-${key}`}
      >
        {label}
        {badge && <span className="nav-badge-hot" aria-hidden="true">{badge}</span>}
        <span className="chevron" aria-hidden="true" />
      </button>
      <ul className="nav-dropdown" id={`dropdown-${key}`} role="menu" aria-label={label}>
        <li role="none">
          <Link href={`${base(lang)}/${section}`} role="menuitem">{allLabel}</Link>
        </li>
        {list.length > 0 && (
          <li role="none" aria-hidden="true"><div className="nav-dropdown-sep" /></li>
        )}
        {list.map(item => (
          <li key={item.slug} role="none">
            <Link href={`${base(lang)}/${section}/${item.slug}`} role="menuitem">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  )

  const renderMobileDropdown = (
    key: string,
    label: string,
    section: 'suites' | 'restaurants' | 'events' | 'sunset-parties' | 'day-pass' | 'transfers',
    allLabel: string,
    list: NavDropdownItem[],
    badge?: string,
  ) => (
    <li className="nav-mobile-item">
      <button
        className="nav-mobile-link"
        aria-expanded={mobileExpanded === key}
        onClick={() => toggleMobile(key)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {label}
          {badge && <span className="nav-badge-hot" aria-hidden="true">{badge}</span>}
        </span>
        <span aria-hidden="true">{mobileExpanded === key ? '−' : '+'}</span>
      </button>
      <ul className={`nav-mobile-sub${mobileExpanded === key ? ' open' : ''}`}>
        <li><Link href={`${base(lang)}/${section}`} onClick={() => setMobileOpen(false)}>{allLabel}</Link></li>
        {list.map(item => (
          <li key={item.slug}>
            <Link href={`${base(lang)}/${section}/${item.slug}`} onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  )

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className={`nav-root ${tone}`} role="banner">
        <div className="nav-top-row">
          <nav className="nav-lang" aria-label="Language selection">
            <button
              className={`nav-lang-btn${lang === 'en' ? ' active' : ''}`}
              onClick={() => router.push(`/en${typeof window !== 'undefined' ? window.location.pathname.replace(/^\/(en|fr)/, '') : ''}`)}
              aria-label="Switch to English"
              aria-current={lang === 'en' ? 'true' : undefined}
            >
              EN
            </button>
            <span className="nav-lang-sep" aria-hidden="true" />
            <button
              className={`nav-lang-btn${lang === 'fr' ? ' active' : ''}`}
              onClick={() => router.push(`/fr${typeof window !== 'undefined' ? window.location.pathname.replace(/^\/(en|fr)/, '') : ''}`)}
              aria-label="Passer en français"
              aria-current={lang === 'fr' ? 'true' : undefined}
            >
              FR
            </button>
          </nav>

          <Link href={base(lang)} className="nav-wordmark" aria-label="Sunset Agafay — Home">
            <img
              src={scrolled ? '/logo_emblem_black.png' : '/logo_emblem_white.png'}
              alt=""
              aria-hidden="true"
              className="nav-wordmark-icon"
              style={{ height: 48, width: 'auto', display: 'block' }}
            />
            <span>Sunset Agafay</span>
          </Link>

          <Link href={`${base(lang)}/reserve`} className="nav-reserve-btn" aria-label={dict.reserve}>
            {dict.reserve}&nbsp;&nbsp;→
          </Link>

          <button
            className="nav-hamburger"
            aria-expanded={mobileOpen}
            aria-controls="nav-mobile-overlay"
            aria-label={mobileOpen ? dict.menu_close : dict.menu_open}
            onClick={() => setMobileOpen(o => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="nav-hairline" aria-hidden="true" />

        <nav aria-label="Main navigation">
          <ul className="nav-links-row" role="menubar">

            <li className="nav-item" role="none">
              <Link href={`${base(lang)}#story`} className="nav-link" role="menuitem">
                {dict.story}
              </Link>
            </li>

            {renderDesktopDropdown('suites', dict.suites, 'suites', dict.suites_all, items.suites)}
            {renderDesktopDropdown('restaurants', dict.restaurants, 'restaurants', dict.restaurants_all, items.restaurants)}
            {renderDesktopDropdown('events', dict.events, 'events', dict.events_all, items.events)}
            {items.partiesEnabled && renderDesktopDropdown('sunset-parties', dict.sunset_parties, 'sunset-parties', dict.sunset_parties_all, items.parties)}
            {items.dayPasses.length > 0 && renderDesktopDropdown('day-pass', dict.day_pass, 'day-pass', dict.day_pass_all, items.dayPasses, dict.day_pass_hot)}
            {renderDesktopDropdown('transfers', dict.transfers, 'transfers', dict.transfers_all, items.transfers)}

            <li className="nav-item" role="none">
              <Link href={`${base(lang)}/experiences`} className="nav-link" role="menuitem">
                {dict.experiences}
              </Link>
            </li>

            <li className="nav-item" role="none">
              <Link href={`${base(lang)}/contact`} className="nav-link" role="menuitem">
                {dict.contact}
              </Link>
            </li>

          </ul>
        </nav>
      </header>

      <div
        id="nav-mobile-overlay"
        className={`nav-mobile-overlay${mobileOpen ? ' open' : ''}`}
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation"
        ref={mobileRef}
      >
        <nav aria-label="Mobile main navigation">
          <ul className="nav-mobile-list">

            <li className="nav-mobile-item">
              <Link href={`${base(lang)}#story`} className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                {dict.story}
              </Link>
            </li>

            {renderMobileDropdown('suites', dict.suites, 'suites', dict.suites_all, items.suites)}
            {renderMobileDropdown('restaurants', dict.restaurants, 'restaurants', dict.restaurants_all, items.restaurants)}
            {renderMobileDropdown('events', dict.events, 'events', dict.events_all, items.events)}
            {items.partiesEnabled && renderMobileDropdown('sunset-parties', dict.sunset_parties, 'sunset-parties', dict.sunset_parties_all, items.parties)}
            {items.dayPasses.length > 0 && renderMobileDropdown('day-pass', dict.day_pass, 'day-pass', dict.day_pass_all, items.dayPasses, dict.day_pass_hot)}
            {renderMobileDropdown('transfers', dict.transfers, 'transfers', dict.transfers_all, items.transfers)}

            <li className="nav-mobile-item">
              <Link href={`${base(lang)}/experiences`} className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                {dict.experiences}
              </Link>
            </li>

            <li className="nav-mobile-item">
              <Link href={`${base(lang)}/contact`} className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                {dict.contact}
              </Link>
            </li>

          </ul>
        </nav>

        <div className="nav-mobile-footer">
          <nav className="nav-mobile-lang" aria-label="Language selection">
            <button
              className={lang === 'en' ? 'active' : ''}
              onClick={() => { setMobileOpen(false); router.push(`/en${typeof window !== 'undefined' ? window.location.pathname.replace(/^\/(en|fr)/, '') : ''}`) }}
              aria-label="Switch to English"
              aria-current={lang === 'en' ? 'true' : undefined}
            >EN</button>
            <span aria-hidden="true" style={{ width: 12, height: 1, background: 'currentColor', opacity: 0.3, display: 'inline-block' }} />
            <button
              className={lang === 'fr' ? 'active' : ''}
              onClick={() => { setMobileOpen(false); router.push(`/fr${typeof window !== 'undefined' ? window.location.pathname.replace(/^\/(en|fr)/, '') : ''}`) }}
              aria-label="Passer en français"
              aria-current={lang === 'fr' ? 'true' : undefined}
            >FR</button>
          </nav>

          <Link
            href={`${base(lang)}/reserve`}
            className="cta"
            style={{ color: 'var(--paper)' }}
            onClick={() => setMobileOpen(false)}
          >
            <span className="cta-label">{dict.reserve}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </>
  )
}
