import type { AggregateRoot } from '@mx-space/api-client'
import { simpleCamelcaseKeys } from '@mx-space/api-client'
import { getTranslations } from 'next-intl/server'
import RSS from 'rss'

import { apiClient } from '~/lib/request'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // 1 day

export async function GET(
  _req: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params
  const tThinking = await getTranslations({
    locale,
    namespace: 'thinking',
  })
  const [agg, thinking] = await Promise.all([
    fetch(apiClient.aggregate.proxy.toString(true), {
      next: {
        revalidate: 86400,
      },
    }).then(
      async (res) =>
        simpleCamelcaseKeys(await res.json()) as Promise<AggregateRoot>,
    ),
    apiClient.recently.getList({
      size: 20,
    }),
  ])

  const { title, description } = agg.seo
  const localeMap: Record<string, string> = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
  }

  const now = new Date()
  const feed = new RSS({
    title: `${tThinking('page_title')} - ${title}`,
    description,
    site_url: agg.url.webUrl,
    feed_url: `${agg.url.webUrl}/${locale}/thinking/feed`,
    language: localeMap[locale] || 'zh-CN',
    generator: 'Shiro (https://github.com/Innei/Shiro)',
    pubDate: now.toUTCString(),
  })

  for (const t of thinking.data) {
    feed.item({
      title: new Date(t.created).toLocaleDateString(localeMap[locale]),
      description:
        `${t.content}\n\n${t.ref?.title ? tThinking('feed_reference', { title: t.ref.title }) : ''}\n\n` +
        ` <p style='text-align: right'>
      <a href='${`${agg.url.webUrl}/${locale}/thinking/${t.id}`}'>${tThinking('feed_comment_cta')}</a>
      </p>`,
      url: `${agg.url.webUrl}/${locale}/thinking`,
      guid: t.id,
      date: t.created,
    })
  }

  return new Response(feed.xml(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=60, s-maxage=86400',
      'CDN-Cache-Control': 'max-age=86400',
      'Cloudflare-CDN-Cache-Control': 'max-age=86400',
      'Vercel-CDN-Cache-Control': 'max-age=86400',
    },
  })
}
