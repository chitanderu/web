import '../styles/index.css'

import { simpleCamelcaseKeys } from '@mx-space/api-client'
import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'

import { appStaticConfig } from '~/app.static.config'
import { fetchServerApiJson } from '~/lib/server-api-fetch'

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

type SiteMetadataPayload = {
  seo: {
    title: string
    description: string
    keywords?: string[]
    icon?: string
    iconDark?: string
  }
  url: {
    webUrl: string
  }
  user: {
    name: string
    socialIds?: Record<string, string | number>
  }
}

export const generateMetadata = async (): Promise<Metadata> => {
  const fetchedData = simpleCamelcaseKeys<SiteMetadataPayload>(
    await fetchServerApiJson('aggregate/site', {
      next: { revalidate: appStaticConfig.cache.ttl.aggregation },
    }),
  )
  const { seo, url, user } = fetchedData
  const favicon = seo.icon || '/favicon.ico'
  const faviconDark = seo.iconDark || favicon

  return {
    metadataBase: new URL(url.webUrl),
    title: {
      template: `%s - ${seo.title}`,
      default: `${seo.title} - ${seo.description}`,
    },
    description: seo.description,
    keywords: seo.keywords?.join(',') || '',
    icons: [
      {
        url: favicon,
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: favicon,
        media: '(prefers-color-scheme: light)',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: faviconDark,
        media: '(prefers-color-scheme: dark)',
      },
    ],

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: {
        default: seo.title,
        template: `%s | ${seo.title}`,
      },
      description: seo.description,
      siteName: `${seo.title}`,
      type: 'website',
      url: url.webUrl,
      images: {
        url: `${url.webUrl}/home-og`,
        username: user.name,
      },
    },
    twitter: {
      creator: `@${user.socialIds?.twitter || user.socialIds?.x || '__oQuery'}`,
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },

    alternates: {
      canonical: url.webUrl,
      types: {
        'application/rss+xml': [{ url: 'feed', title: 'RSS Subscribe' }],
      },
    },
  } satisfies Metadata
}

export default function RootLayout({ children }: PropsWithChildren) {
  return children
}
