import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'fr'] as const
const defaultLocale = 'en'
const ADMIN_COOKIE = 'sa_admin'

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().startsWith('fr')) return 'fr'
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ['/((?!_next|favicon\\.ico|images|fonts|icons|og|sitemap|robots|api|uploads|.*\\.(?:webp|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)).*)'],
}
