export type IconName =
  | 'home' | 'book' | 'bed' | 'user' | 'star' | 'fork' | 'mail'
  | 'chart' | 'cog' | 'search' | 'plus' | 'edit' | 'trash' | 'upload'
  | 'check' | 'arrow' | 'arrowL' | 'bell' | 'sun' | 'image' | 'sort'
  | 'filter' | 'more' | 'eye' | 'leaf' | 'calendar' | 'car' | 'x' | 'menu'

interface IconProps { name: IconName; size?: number; className?: string }

const paths: Record<IconName, React.ReactNode> = {
  home:     <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>,
  book:     <><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  bed:      <><path d="M3 18V8" /><path d="M21 18v-4a3 3 0 0 0-3-3H3" /><path d="M3 14h18" /><circle cx="7" cy="11" r="1.5" /></>,
  user:     <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" /></>,
  star:     <><polygon points="12,4 14.5,9.5 20.5,10.2 16,14.3 17.3,20 12,17 6.7,20 8,14.3 3.5,10.2 9.5,9.5" /></>,
  fork:     <><path d="M8 4v6a3 3 0 0 0 3 3v7" /><path d="M14 4v6a3 3 0 0 1-3 3" /><path d="M6 4v4" /></>,
  mail:     <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 7 9-7" /></>,
  chart:    <><path d="M4 20V8" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M3 20h18" /></>,
  cog:      <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  search:   <><circle cx="11" cy="11" r="6.5" /><path d="m21 21-4.5-4.5" /></>,
  plus:     <><path d="M12 5v14M5 12h14" /></>,
  edit:     <><path d="M4 20h4l11-11-4-4L4 16Z" /><path d="m14 6 4 4" /></>,
  trash:    <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7v13h12V7" /><path d="M10 11v6M14 11v6" /></>,
  upload:   <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
  check:    <><path d="m5 12 5 5L20 7" /></>,
  arrow:    <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowL:   <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  bell:     <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16Z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  sun:      <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  image:    <><rect x="3" y="5" width="18" height="14" rx="1.5" /><circle cx="9" cy="10" r="1.5" /><path d="m21 17-6-6-9 8" /></>,
  sort:     <><path d="M8 6v12" /><path d="m5 9 3-3 3 3" /><path d="M16 18V6" /><path d="m13 15 3 3 3-3" /></>,
  filter:   <><path d="M4 5h16l-6 8v6l-4-2v-4Z" /></>,
  more:     <><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></>,
  eye:      <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  leaf:     <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  car:      <><path d="M5 17H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13l4 7v5a2 2 0 0 1-2 2h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  x:        <><path d="M18 6 6 18M6 6l12 12" /></>,
  menu:     <><path d="M4 6h16M4 12h16M4 18h16" /></>,
}

export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  )
}
