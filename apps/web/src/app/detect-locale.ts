import { headers } from 'next/headers'

import { REQUEST_LOCALE } from '~/constants/system'
import { defaultLocale, locales } from '~/i18n/config'

export async function detectLocaleFromHeaders() {
  const h = await headers()

  const requestLocale = h.get(REQUEST_LOCALE)
  if (requestLocale && (locales as readonly string[]).includes(requestLocale)) {
    return requestLocale
  }

  const pathname = h.get('x-invoke-path') || h.get('x-url') || ''
  const firstSegment = pathname.split('/').find(Boolean)
  if (firstSegment && (locales as readonly string[]).includes(firstSegment)) {
    return firstSegment
  }
  return defaultLocale
}
