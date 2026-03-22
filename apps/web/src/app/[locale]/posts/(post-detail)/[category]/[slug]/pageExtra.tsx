'use client'

import type { Image } from '@mx-space/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import type { FC, PropsWithChildren } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import type { BlogPosting, WithContext } from 'schema-dts'

import { appStaticConfig } from '~/app.static.config'
import { useFocusReading } from '~/atoms/hooks/reading'
import { withClientOnly } from '~/components/common/ClientOnly'
import { AIGenBadge } from '~/components/modules/ai/AIGenBadge'
import { PeekLink } from '~/components/modules/peek/PeekLink'
import { PostMetaBar } from '~/components/modules/post/PostMetaBar'
import { CurrentReadingCountingMetaBarItem } from '~/components/modules/shared/MetaBar'
import {
  NoticeCard,
  NoticeCardItem,
  TranslationNoticeContent,
} from '~/components/modules/shared/NoticeCard'
import { SummarySwitcher } from '~/components/modules/shared/SummarySwitcher'
import { WithArticleSelectionAction } from '~/components/modules/shared/WithArticleSelectionAction'
import { TranslationLanguageSwitcher } from '~/components/modules/translation/TranslationLanguageSwitcher'
import { RelativeTime } from '~/components/ui/relative-time'
import { useRouter } from '~/i18n/navigation'
import { logger } from '~/lib/logger'
import { noopArr } from '~/lib/noop'
import { MarkdownImageRecordProvider } from '~/providers/article/MarkdownImageRecordProvider'
import {
  useCurrentPostDataSelector,
  useSetCurrentPostData,
} from '~/providers/post/CurrentPostDataProvider'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'
import type { PostWithTranslation } from '~/queries/definition'
import { queries } from '~/queries/definition'

export const LdJsonWithAuthor = ({
  baseLdJson,
}: {
  baseLdJson: WithContext<BlogPosting>
}) => {
  const jsonLd = useAggregationSelector(
    (state) =>
      ({
        ...baseLdJson,
        author: {
          '@type': 'Person',
          name: state.user.name,
          url: state.url.webUrl,
        },
      }) as WithContext<BlogPosting>,
  )
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  )
}
export const PostTitle = () => {
  const title = useCurrentPostDataSelector((data) => data?.title)!

  return (
    <h1 className="mb-8 text-balance text-center text-4xl font-bold leading-tight">
      {title}
    </h1>
  )
}
export const MarkdownSelection: Component = (props) => {
  const id = useCurrentPostDataSelector((data) => data?.id)!
  const title = useCurrentPostDataSelector((data) => data?.title)!
  const allowComment = useCurrentPostDataSelector((data) => data?.allowComment)!
  const contentFormat = useCurrentPostDataSelector(
    (data) => data?.contentFormat,
  )
  const content = useCurrentPostDataSelector((data) => data?.content)
  const translationLang = useCurrentPostDataSelector((data) =>
    data?.isTranslated ? data.translationMeta?.targetLang : null,
  )
  return (
    <WithArticleSelectionAction
      canComment={allowComment}
      content={contentFormat === 'lexical' ? (content ?? undefined) : undefined}
      contentFormat={contentFormat}
      refId={id}
      title={title}
      translationLang={translationLang}
    >
      {props.children}
    </WithArticleSelectionAction>
  )
}
export const FocusReadingEffect = () => {
  useFocusReading()
  return null
}

export const PostMarkdownImageRecordProvider = (props: PropsWithChildren) => {
  const images = useCurrentPostDataSelector(
    (data) => data?.images ?? (noopArr as Image[]),
  )

  return (
    <MarkdownImageRecordProvider images={images}>
      {props.children}
    </MarkdownImageRecordProvider>
  )
}
export const PostMetaBarInternal: Component = ({ className }) => {
  const meta = useCurrentPostDataSelector((data) => {
    if (!data) return
    return {
      created: data.created,
      category: data.category,
      tags: data.tags,
      count: data.count,
      modified: data.modified,
      aiGen: data.meta?.aiGen,
      availableTranslations: (data as any).availableTranslations as
        | string[]
        | undefined,
      translationMeta: data.translationMeta,
    }
  })

  if (!meta) return null
  return (
    <PostMetaBar className={className} meta={meta}>
      <CurrentReadingCountingMetaBarItem />
      <AIGenBadge value={meta.aiGen} />
      <TranslationLanguageSwitcher
        availableTranslations={meta.availableTranslations}
        sourceLang={meta.translationMeta?.sourceLang}
      />
    </PostMetaBar>
  )
}

export const PostDataReValidate: FC<{
  fetchedAt: string
}> = withClientOnly(({ fetchedAt }) => {
  const isOutdated = useMemo(
    () =>
      Date.now() - new Date(fetchedAt).getTime() > appStaticConfig.revalidate,
    [fetchedAt],
  )
  const dataSetter = useSetCurrentPostData()

  const locale = useLocale()

  const { category, slug } = useCurrentPostDataSelector((post) => {
    if (!post) return {}
    return {
      category: post.category,
      slug: post.slug,
    }
  })
  const onceRef = useRef(false)
  const queryClient = useQueryClient()
  useEffect(() => {
    if (onceRef.current) return

    onceRef.current = true
    if (!isOutdated) return

    if (!category || !slug) return

    queryClient
      .fetchQuery(queries.post.bySlug(category.slug, slug, locale))
      .then((data) => {
        dataSetter(data as PostWithTranslation)
        logger.log('Post data revalidated', data)
      })
  }, [category, dataSetter, isOutdated, locale, queryClient, slug])
  return null
})

export const SlugReplacer = ({ to }: { to: string }) => {
  const router = useRouter()
  const onceRef = useRef(false)

  if (!onceRef.current) {
    onceRef.current = true
    router.replace(to)
  }

  return null
}

export const PostNoticeCard = () => {
  const t = useTranslations('post')
  const data = useCurrentPostDataSelector((s) => {
    if (!s) return null
    return {
      id: s.id,
      modified: s.modified,
      isTranslated: s.isTranslated,
      translationMeta: s.translationMeta,
      summary: s.summary || '',
      related: s.related,
    }
  })

  if (!data) return null

  const { id, modified, isTranslated, translationMeta, summary, related } = data
  const contentLang = isTranslated
    ? translationMeta?.targetLang
    : translationMeta?.sourceLang
  const isOutdated = modified
    ? differenceInDays(new Date(), new Date(modified)) > 60
    : false

  return (
    <NoticeCard className="my-8">
      {isOutdated && modified && (
        <NoticeCardItem>
          <div className="flex items-center gap-2 text-xs text-neutral-5">
            <span className="opacity-90">
              <i className="i-mingcute-warning-line text-base" />
            </span>
            <span>
              {t('outdated_prefix')}
              <RelativeTime date={modified} />
              {t('outdated_suffix')}
            </span>
          </div>
        </NoticeCardItem>
      )}
      {related && related.length > 0 && (
        <NoticeCardItem>
          <div
            data-hide-print
            className="flex items-center gap-2 text-xs text-neutral-5"
          >
            <span className="opacity-90">
              <i className="i-mingcute-link-2-line text-base" />
            </span>
            <span>{t('related_before')}</span>
          </div>
          <div className="mt-1.5 space-y-1.5 pl-[calc(1rem+8px)]">
            {related.map((post) => {
              const href = `/posts/${post.category.slug}/${post.slug}`
              return (
                <div className="flex items-center gap-1.5" key={href}>
                  <span className="text-neutral-4">
                    <i className="i-mingcute-arrow-right-line text-sm" />
                  </span>
                  <PeekLink
                    className="text-sm text-neutral-7 transition-colors hover:text-accent"
                    href={href}
                  >
                    {post.title}
                  </PeekLink>
                </div>
              )
            })}
          </div>
        </NoticeCardItem>
      )}
      {isTranslated && translationMeta && (
        <NoticeCardItem>
          <TranslationNoticeContent translationMeta={translationMeta} />
        </NoticeCardItem>
      )}
      <NoticeCardItem variant="summary">
        <SummarySwitcher
          articleId={id!}
          lang={contentLang}
          summary={summary}
          variant="inline"
        />
      </NoticeCardItem>
    </NoticeCard>
  )
}
