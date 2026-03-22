// @see https://x.com/huozhi/status/1921693249577889878
import '../styles/index.css'

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { PublicEnvScript } from 'next-runtime-env'

import { NotFound404 } from '~/components/common/404'
import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { Global } from '~/components/common/Global'
import { Root } from '~/components/layout/root/Root'
import { AccentColorStyleInjector } from '~/components/modules/shared/AccentColorStyleInjector'
import { sansFont, serifFont } from '~/lib/fonts'
import { AggregationProvider } from '~/providers/root/aggregation-data-provider'

import { WebAppProviders } from '../providers/root'
import { fetchAggregationData } from './[locale]/api'
import { detectLocaleFromHeaders } from './detect-locale'

export default async function GlobalNotFound() {
  const locale = await detectLocaleFromHeaders()
  setRequestLocale(locale)
  const messages = await getMessages()

  const data = await fetchAggregationData().catch(() => null)

  return (
    <html suppressHydrationWarning className="noise themed" lang={locale}>
      <head>
        <PublicEnvScript />
        <Global />
        {data?.theme.config?.color && (
          <AccentColorStyleInjector color={data.theme.config.color} />
        )}
      </head>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${serifFont.variable} m-0 h-full p-0 font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ErrorBoundary>
            <WebAppProviders>
              {data && (
                <AggregationProvider
                  aggregationData={data}
                  appConfig={data.theme.config}
                />
              )}
              <div data-theme id="root">
                <Root>
                  <NotFound404 />
                </Root>
              </div>
            </WebAppProviders>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "This planet doesn't have knowledge yet, go explore other places.",
  robots: {
    index: false,
  },
}
