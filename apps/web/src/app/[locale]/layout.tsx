import process from 'node:process'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server'
import { PublicEnvScript } from 'next-runtime-env'
import { fetch } from 'ofetch'
import type { PropsWithChildren } from 'react'

import PKG from '~/../package.json'
import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { Global } from '~/components/common/Global'
import { HydrationEndDetector } from '~/components/common/HydrationEndDetector'
import { OpenPanelInit } from '~/components/common/OpenPanelInit'
import { SafariDetector } from '~/components/common/SafariDetector'
import { SyncServerTime } from '~/components/common/SyncServerTime'
import { Root } from '~/components/layout/root/Root'
import { AccentColorStyleInjector } from '~/components/modules/shared/AccentColorStyleInjector'
import { APlayerWidget } from '~/components/modules/shared/APlayerWidget'
import { SearchPanelWithHotKey } from '~/components/modules/shared/SearchFAB'
import { BackgroundTexture } from '~/components/ui/background/BackgroundTexture'
import { RootPortal } from '~/components/ui/portal'
import { routing } from '~/i18n/routing'
import { PreRenderError } from '~/lib/error-factory'
import { sansFont, serifFont } from '~/lib/fonts'
import { apiClient } from '~/lib/request'
import { AggregationProvider } from '~/providers/root/aggregation-data-provider'
import { AppFeatureProvider } from '~/providers/root/app-feature-provider'
import { HydrateuserAuthProvider } from '~/providers/root/hydrate-user-auth-provider'
import { ScriptInjectProvider } from '~/providers/root/script-inject-provider'

import { WebAppProviders } from '../../providers/root'
import { Analyze } from './analyze'
import { fetchAggregationData } from './api'

const { version } = PKG

export const dynamic = 'force-dynamic'

interface Props extends PropsWithChildren {
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages({ locale })
  const tError = await getTranslations({ locale, namespace: 'error' })

  const data = await fetchAggregationData({ locale }).catch(
    (err) => new PreRenderError(err.message),
  )

  if (data instanceof PreRenderError) {
    return (
      <html suppressHydrationWarning className="noise themed" lang={locale}>
        <head>
          <PublicEnvScript />
          <SayHi />
        </head>
        <body
          suppressHydrationWarning
          className={`${sansFont.variable} ${serifFont.variable} m-0 h-full p-0 font-sans`}
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="center flex h-screen">
              {tError('api_fetchError')}
              <br />
              {data.message}
            </div>
          </NextIntlClientProvider>
        </body>
      </html>
    )
  }

  const themeConfig = data.theme
  const favicon = data.seo.icon || themeConfig.config.site.favicon
  const faviconDark = themeConfig.config.site.faviconDark || favicon
  const { openpanel } = themeConfig.config.module || {}
  const headers = new Headers()

  headers.append(
    'cookie',
    (await cookies())
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; '),
  )

  headers.append('user-agent', 'Shiro')

  const userAuth = await fetch(
    apiClient.proxy('owner')('check_logged').toString(true),
    { headers },
  )
    .then((res) => res.json())
    .then((res) => !!res.ok)
    .catch(() => false)

  return (
    <>
      <AppFeatureProvider tmdb={!!process.env.TMDB_API_KEY}>
        <HydrateuserAuthProvider isLogged={userAuth} />
        <html suppressHydrationWarning className="noise themed" lang={locale}>
          <head>
            <PublicEnvScript />
            <Global />
            <SayHi />
            <HydrationEndDetector />
            {themeConfig.config?.color && (
              <AccentColorStyleInjector color={themeConfig.config.color} />
            )}
            <link
              href={faviconDark}
              media="(prefers-color-scheme: dark)"
              rel="shortcut icon"
              type="image/x-icon"
            />
            <link
              href={favicon}
              media="(prefers-color-scheme: light)"
              rel="shortcut icon"
              type="image/x-icon"
            />
            <ScriptInjectProvider />
          </head>
          <body
            suppressHydrationWarning
            className={`${sansFont.variable} ${serifFont.variable} m-0 h-full p-0 font-sans`}
          >
            <NextIntlClientProvider locale={locale} messages={messages}>
              <SafariDetector />
              <ErrorBoundary>
                <WebAppProviders>
                  {openpanel?.enable && (
                    <OpenPanelInit
                      apiUrl={openpanel.url}
                      clientId={openpanel.id}
                      trackOutgoingLinks={true}
                      trackScreenViews={true}
                    />
                  )}
                  <AggregationProvider
                    aggregationData={data}
                    appConfig={themeConfig.config}
                  />
                  <div data-theme id="root">
                    <Root>{children}</Root>
                  </div>
                  <SearchPanelWithHotKey />
                  <APlayerWidget />
                  <Analyze />
                  <SyncServerTime />
                  <div className="fixed inset-y-0 right-0 w-[var(--removed-body-scroll-bar-size)]" />
                  <RootPortal>
                    <BackgroundTexture />
                  </RootPortal>
                </WebAppProviders>
              </ErrorBoundary>
            </NextIntlClientProvider>
          </body>
        </html>
      </AppFeatureProvider>
    </>
  )
}

const SayHi = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `var version = "${version}";
    (${function () {
      console.info(
        `%c Mix Space %c https://github.com/mx-space`,
        'color: #fff; margin: 1em 0; padding: 5px 0; background: #2980b9;',
        'margin: 1em 0; padding: 5px 0; background: #efefef;',
      )
      console.info(
        `%c 余白 / Yohaku ${window.version} %c https://innei.in`,
        'color: #fff; margin: 1em 0; padding: 5px 0; background: #39C5BB;',
        'margin: 1em 0; padding: 5px 0; background: #efefef;',
      )

      const motto = `
余白 / Yohaku
--------
What's left unsaid holds the most weight.

The blank space is part of the writing.
`

      if (document.firstChild?.nodeType !== Node.COMMENT_NODE) {
        document.prepend(document.createComment(motto))
      }
    }.toString()})();`,
    }}
  />
)

declare global {
  interface Window {
    version: string
  }
}
