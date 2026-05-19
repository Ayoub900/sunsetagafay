import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

const locales = ['en', 'fr'] as const
const defaultLocale = 'en'
const ADMIN_COOKIE = 'sa_admin'

// Global per-IP request budget for page navigation.
const GLOBAL_LIMIT      = 120
const GLOBAL_WINDOW_MS  = 60_000

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().startsWith('fr')) return 'fr'
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through static files in /public that shouldn't be locale-prefixed
  // (robots.txt, llms.txt, sitemap.xml, opengraph images, etc.)
  if (
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Global rate limit on every matched request.
  const ip      = getClientIp(request.headers)
  const limited = rateLimit(`page:${ip}`, GLOBAL_LIMIT, GLOBAL_WINDOW_MS)
  if (!limited.allowed) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(limited.retryAfter),
        ...rateLimitHeaders(limited),
      },
    })
  }

  // Admin route protection — runs before locale logic
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/setup') {
      return NextResponse.next()
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    const validToken = process.env.ADMIN_TOKEN
    if (!token || !validToken || token !== validToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // i18n locale routing
  const hasLocale = locales.some(
    l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  )

  if (!hasLocale) {
    const locale = getLocale(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  const locale = pathname.split('/')[1] ?? defaultLocale
  const response = NextResponse.next()
  response.headers.set('x-locale', locale)
  return response
}

export const config = {
  matcher: ['/((?!_next|favicon\\.ico|images|fonts|icons|og|sitemap|robots|llms|api|uploads|opengraph-image|.*\\.(?:webp|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|txt)).*)'],
}
