import 'server-only'

import { cookies, headers as nextHeaders } from 'next/headers'
import { createFetch } from 'ofetch'

import PKG from '~/../package.json'
import { REQUEST_LOCALE } from '~/constants/system'

import { createApiClient, createFetchAdapter } from './shared'

const isDev = process.env.NODE_ENV === 'development'

export const $fetch = createFetch({
  defaults: {
    timeout: 8000,
    credentials: 'include',
    async onRequest(context) {
      const cookie = await cookies()
      let headers: any = context.options.headers
      if (headers && headers instanceof Headers) {
        headers = Object.fromEntries(headers.entries())
      } else {
        headers = {}
      }

      const cookieHeader = cookie
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ')
      if (cookieHeader) {
        headers['cookie'] = cookieHeader
        context.options.cache = 'no-store'
      }

      context.options.params ??= {}

      if (isDev) {
        console.info(`[Request/Server]: ${context.request}`)
      }

      const { get } = await nextHeaders()

      const ua = get('user-agent')
      const ip =
        get('x-real-ip') ||
        get('x-forwarded-for') ||
        get('remote-addr') ||
        get('cf-connecting-ip')

      if (ip) {
        headers['x-real-ip'] = ip
        headers['x-forwarded-for'] = ip
      }

      headers['User-Agent'] =
        `${ua} NextJS/v${PKG.dependencies.next} ${PKG.name}/${PKG.version}`

      // Prefer an explicit per-request locale, then fall back to the locale
      // normalized by proxy.ts from the incoming request.
      const referer = get('referer') || get('x-invoke-path')
      const explicitLocale = headers['x-lang'] || headers['X-Lang']
      const locale = explicitLocale || get(REQUEST_LOCALE)

      if (isDev) {
        console.log('locale extracted:', locale, 'from referer:', referer)
      }

      if (locale) {
        headers['x-lang'] = locale
      }

      context.options.headers = headers
    },
    onResponse(context) {
      console.info(
        `[Response/Server]: ${context.request}`,
        context.response.status,
      )
    },
  },
})
export const apiClient = createApiClient(createFetchAdapter($fetch))

const Noop = () => null
export const attachFetchHeader = () => Noop

export const setGlobalSearchParams = Noop
export const clearGlobalSearchParams = Noop

export const isReactServer = true
