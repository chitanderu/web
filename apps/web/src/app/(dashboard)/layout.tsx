import type { Viewport } from 'next'
import { PublicEnvScript } from 'next-runtime-env'
import type { PropsWithChildren } from 'react'

import { HydrationEndDetector } from '~/components/common/HydrationEndDetector'
import { sansFont, serifFont } from '~/lib/fonts'
import { DashboardAppProviders } from '~/providers/root'

import { DashboardClientShell } from './spa-shell'

// Dashboard is a pure SPA entry. Keep it static and do all data fetching on the client.
export const dynamic = 'force-static'
export const revalidate = false

export function generateViewport(): Viewport {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
      { media: '(prefers-color-scheme: light)', color: '#faf7f0' },
    ],
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
    minimumScale: 1,
    maximumScale: 1,
  }
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html suppressHydrationWarning lang="zh-CN">
      <head>
        <title>Shiro · Light Dashboard | Powered by Mix Space</title>
        <HydrationEndDetector />
        <link href="/favicon.ico" rel="icon" sizes="any" />
        <PublicEnvScript />
      </head>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${serifFont.variable} m-0 h-full bg-[var(--color-root-bg)] p-0 font-sans`}
        id="dashboard"
      >
        <DashboardAppProviders>
          <DashboardClientShell>{children}</DashboardClientShell>
        </DashboardAppProviders>
      </body>
    </html>
  )
}
