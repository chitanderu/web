import { geolocation, ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

import {
  REQUEST_GEO,
  REQUEST_HOST,
  REQUEST_IP,
  REQUEST_LOCALE,
  REQUEST_PATHNAME,
  REQUEST_QUERY,
} from './constants/system'
import { defaultLocale, locales } from './i18n/config'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

function getLocaleFromPathname(pathname: string): string {
  const firstSegment = pathname.split('/').find(Boolean)
  if (firstSegment && (locales as readonly string[]).includes(firstSegment)) {
    return firstSegment
  }
  return defaultLocale
}

const shouldSkipIntl = (pathname: string) => {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/feed') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/home-og') ||
    pathname === '/robots.txt' ||
    pathname.includes('.')
  )
}

/**
 * Append custom request headers to a middleware response by extending
 * the Next.js `x-middleware-override-headers` mechanism.
 * Preserves any headers already set by previous middleware (e.g. next-intl).
 */
function appendRequestHeaders(
  response: NextResponse,
  headers: Record<string, string>,
) {
  const existing = response.headers.get('x-middleware-override-headers') || ''
  const overrideList = existing.split(',').filter(Boolean)

  for (const [name, value] of Object.entries(headers)) {
    const lowerName = name.toLowerCase()
    if (!overrideList.includes(lowerName)) {
      overrideList.push(lowerName)
    }
    response.headers.set(`x-middleware-request-${lowerName}`, value)
  }

  response.headers.set('x-middleware-override-headers', overrideList.join(','))
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  let geo = geolocation(req)
  const { headers } = req
  let ip = ipAddress(req) ?? headers.get('x-real-ip')
  const forwardedFor = headers.get('x-forwarded-for')
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(',').at(0) ?? ''
  }
  const cfGeo = headers.get('cf-ipcountry')
  if (cfGeo && !geo) {
    geo = {
      country: cfGeo,
      city: headers.get('cf-ipcity') ?? '',
      latitude: headers.get('cf-iplatitude') ?? '',
      longitude: headers.get('cf-iplongitude') ?? '',
      region: headers.get('cf-region') ?? '',
    }
  }

  const { searchParams } = req.nextUrl

  if (searchParams.has('peek-to')) {
    const peekTo = searchParams.get('peek-to')
    if (peekTo) {
      const clonedUrl = req.nextUrl.clone()
      clonedUrl.pathname = peekTo
      clonedUrl.searchParams.delete('peek-to')
      return NextResponse.redirect(clonedUrl)
    }
  }

  const customHeaders: Record<string, string> = {
    [REQUEST_PATHNAME]: pathname,
    [REQUEST_QUERY]: search,
    [REQUEST_GEO]: geo?.country || 'unknown',
    [REQUEST_IP]: ip || '',
    [REQUEST_HOST]: headers.get('host') || '',
    [REQUEST_LOCALE]: getLocaleFromPathname(pathname),
  }

  if (!shouldSkipIntl(pathname)) {
    const response = intlMiddleware(req)

    if (response.headers.get('location')) {
      return response
    }

    appendRequestHeaders(response, customHeaders)
    return response
  }

  const response = NextResponse.next()
  appendRequestHeaders(response, customHeaders)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)'],
}
