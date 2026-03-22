import '../styles/index.css'

import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server'
import { PublicEnvScript } from 'next-runtime-env'

import { NotFound404 } from '~/components/common/404'
import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { Global } from '~/components/common/Global'
import { Root } from '~/components/layout/root/Root'
import { AccentColorStyleInjector } from '~/components/modules/shared/AccentColorStyleInjector'
import { StyledButton } from '~/components/ui/button'
import { Link } from '~/i18n/navigation'
import { sansFont, serifFont } from '~/lib/fonts'
import { AggregationProvider } from '~/providers/root/aggregation-data-provider'

import { WebAppProviders } from '../providers/root'
import { fetchAggregationData } from './[locale]/api'
import { detectLocaleFromHeaders } from './detect-locale'

export default async function NotFound() {
  const locale = await detectLocaleFromHeaders()
  setRequestLocale(locale)
  const messages = await getMessages()
  const t = await getTranslations('error')

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
                  <NotFound404>
                    <StyledButton>
                      <Link href="/">{t('404_backHome')}</Link>
                    </StyledButton>
                  </NotFound404>
                </Root>
              </div>
            </WebAppProviders>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
