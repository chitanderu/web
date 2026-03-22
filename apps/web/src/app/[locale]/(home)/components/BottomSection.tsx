'use client'

import type {
  BookMetadata,
  MediaMetadata,
  MusicMetadata,
  RecentlyModel,
} from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { RelativeTime } from '~/components/ui/relative-time'
import { Link } from '~/i18n/navigation'
import { getNoteRouteParams } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

const useRecentlyData = (locale: string) =>
  useQuery({
    queryKey: ['recently', 'home', locale],
    queryFn: async () =>
      (await apiClient.recently.getList({ size: 20 })).$serialized,
    staleTime: 5 * 60 * 1000,
  })

const useRecentComments = (locale: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['home-activity-recent', locale],
    queryFn: async () =>
      (await apiClient.activity.getRecentActivities()).$serialized,
    refetchOnMount: true,
    meta: { persist: true },
  })
  const comments = useMemo(() => {
    if (!data?.comment) return []
    const seen = new Set<string>()
    const unique: typeof data.comment = []
    for (const c of data.comment) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      unique.push(c)
      if (unique.length >= 3) break
    }
    return unique
  }, [data])
  return { comments, isLoading }
}

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 text-xs uppercase tracking-[4px] text-neutral-6 lg:mb-5">
    {children}
  </div>
)

const NowStatus = ({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useRecentlyData>['data']
  isLoading: boolean
}) => {
  const t = useTranslations('home')

  const nowItems = useMemo(() => {
    if (!data?.data) return null
    const items = data.data as RecentlyModel[]
    const book = items.find((i) => i.type === 'book')
    const music = items.find((i) => i.type === 'music')
    const media = items.find((i) => i.type === 'media')
    if (!book && !music && !media) return null
    return { book, music, media }
  }, [data])

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="mb-3 h-4 w-[70%] animate-pulse rounded bg-neutral-3"
            key={i}
          />
        ))}
      </div>
    )
  }

  if (!nowItems) return null

  return (
    <div>
      {nowItems.book?.metadata && (
        <div className="mb-3.5 last:mb-0">
          <div className="mb-1 text-xs text-neutral-6">
            {t('second_reading')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📖</span>
            <span className="text-base text-neutral-8">
              {(nowItems.book.metadata as BookMetadata).title}
            </span>
            <span className="text-xs text-neutral-6">
              {(nowItems.book.metadata as BookMetadata).author}
            </span>
          </div>
        </div>
      )}
      {nowItems.music?.metadata && (
        <div className="mb-3.5 last:mb-0">
          <div className="mb-1 text-xs text-neutral-6">
            {t('second_listening')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">♪</span>
            <span className="text-base text-neutral-8">
              {(nowItems.music.metadata as MusicMetadata).title}
            </span>
            <span className="text-xs text-neutral-6">
              {(nowItems.music.metadata as MusicMetadata).artist}
            </span>
          </div>
        </div>
      )}
      {nowItems.media?.metadata && (
        <div className="mb-3.5 last:mb-0">
          <div className="mb-1 text-xs text-neutral-6">
            {t('second_watching')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base text-neutral-8">
              {(nowItems.media.metadata as MediaMetadata).title}
            </span>
            {/* eslint-disable-next-line eqeqeq */}
            {(nowItems.media.metadata as MediaMetadata).rating != null && (
              <span className="text-xs text-amber-500">
                {'★'.repeat(
                  Math.round(
                    ((nowItems.media.metadata as MediaMetadata).rating ?? 0) /
                      2,
                  ),
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const RecentLetters = ({
  comments,
  isLoading,
}: {
  comments: {
    created: string
    author: string
    text: string
    id: string
    title: string
    slug?: string
    nid?: string
    type: string
  }[]
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            className="mb-2.5 h-16 animate-pulse rounded bg-neutral-3"
            key={i}
          />
        ))}
      </div>
    )
  }

  if (!comments.length) return null

  return (
    <div>
      {comments.map((comment) => {
        const commentUrl =
          comment.type === 'Note' && comment.nid
            ? routeBuilder(
                Routes.Note,
                getNoteRouteParams({ nid: Number(comment.nid) }),
              )
            : comment.slug
              ? routeBuilder(Routes.Post, { category: '-', slug: comment.slug })
              : undefined

        return (
          <div
            className="mb-2.5 rounded-[3px] bg-[rgba(200,180,160,0.05)] p-3.5 last:mb-0 dark:bg-neutral-2/30"
            key={comment.id}
          >
            <div className="line-clamp-2 text-base italic leading-[1.7] text-neutral-7">
              &ldquo;{comment.text}&rdquo;
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-xs text-neutral-6">
              {commentUrl && comment.title ? (
                <Link
                  className="truncate text-neutral-6 transition-colors hover:text-accent"
                  href={commentUrl}
                >
                  {comment.title}
                </Link>
              ) : (
                <span />
              )}
              <span className="ml-2 shrink-0 whitespace-nowrap">
                &mdash; {comment.author} &middot;{' '}
                <RelativeTime date={comment.created} />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const Musings = ({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useRecentlyData>['data']
  isLoading: boolean
}) => {
  const musings = useMemo(() => {
    if (!data?.data) return []
    const items = data.data as RecentlyModel[]
    return items.filter((i) => i.type === 'text').slice(0, 2)
  }, [data])

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            className="mb-3 h-12 animate-pulse rounded bg-neutral-3"
            key={i}
          />
        ))}
      </div>
    )
  }

  if (!musings.length) return null

  return (
    <div>
      {musings.map((musing) => (
        <div
          className="mb-3.5 border-l-2 border-[rgba(200,180,160,0.15)] pl-3 last:mb-0 dark:border-neutral-3"
          key={musing.id}
        >
          <div className="text-base italic leading-[1.8] text-neutral-7">
            &ldquo;{musing.content}&rdquo;
          </div>
        </div>
      ))}
      {musings[0] && (
        <div className="mt-2 text-xs text-neutral-6">
          <RelativeTime date={musings[0].created} />
        </div>
      )}
    </div>
  )
}

export const BottomSection = () => {
  const t = useTranslations('home')
  const locale = useLocale()
  const recentlyQuery = useRecentlyData(locale)
  const commentsQuery = useRecentComments(locale)

  const nowItems = useMemo(() => {
    if (!recentlyQuery.data?.data) return null
    const items = recentlyQuery.data.data as RecentlyModel[]
    const book = items.find((i) => i.type === 'book')
    const music = items.find((i) => i.type === 'music')
    const media = items.find((i) => i.type === 'media')
    if (!book && !music && !media) return null
    return { book, music, media }
  }, [recentlyQuery.data])

  const musings = useMemo(() => {
    if (!recentlyQuery.data?.data) return []
    const items = recentlyQuery.data.data as RecentlyModel[]
    return items.filter((i) => i.type === 'text').slice(0, 2)
  }, [recentlyQuery.data])

  const isLoading = recentlyQuery.isLoading || commentsQuery.isLoading
  const hasNow = !!nowItems
  const hasLetters = commentsQuery.comments.length > 0
  const hasMusings = musings.length > 0
  const hasAny = hasNow || hasLetters || hasMusings

  if (!hasAny && !isLoading) return null

  const columns: ReactNode[] = []
  const addColumn = (key: string, show: boolean, content: ReactNode) => {
    if (!show && !isLoading) return
    if (columns.length > 0) {
      columns.push(
        <div
          className="hidden w-px shrink-0 bg-[rgba(200,180,160,0.12)] dark:bg-neutral-2 lg:block"
          key={`div-${key}`}
        />,
      )
    }
    columns.push(
      <div className="min-w-0 flex-1" key={key}>
        {content}
      </div>,
    )
  }

  addColumn(
    'now',
    hasNow,
    <>
      <SectionHeading>{t('second_now')}</SectionHeading>
      <NowStatus
        data={recentlyQuery.data}
        isLoading={recentlyQuery.isLoading}
      />
    </>,
  )

  addColumn(
    'letters',
    hasLetters,
    <>
      <SectionHeading>{t('second_letters')}</SectionHeading>
      <RecentLetters
        comments={commentsQuery.comments}
        isLoading={commentsQuery.isLoading}
      />
    </>,
  )

  addColumn(
    'musings',
    hasMusings,
    <>
      <SectionHeading>{t('second_musings')}</SectionHeading>
      <Musings data={recentlyQuery.data} isLoading={recentlyQuery.isLoading} />
    </>,
  )

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">{columns}</div>
  )
}
