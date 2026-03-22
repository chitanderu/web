'use client'

import type { AggregateTopNote, AggregateTopPost } from '@mx-space/api-client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { RelativeTime } from '~/components/ui/relative-time'
import { Link } from '~/i18n/navigation'
import { getNoteRouteParams } from '~/lib/note-route'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { useHomeQueryData } from '../useHomeQueryData'

export const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 text-xs uppercase tracking-[4px] text-neutral-6 lg:mb-5">
    {children}
  </div>
)

type MergedItem =
  | (AggregateTopPost & { type: 'post' })
  | (AggregateTopNote & { type: 'note' })

function getItemUrl(item: MergedItem): string {
  if (item.type === 'post') {
    return routeBuilder(Routes.Post, {
      category: item.category.slug,
      slug: item.slug,
    })
  }
  return routeBuilder(Routes.Note, {
    ...getNoteRouteParams(item),
  })
}

const FeaturedPost = ({ item }: { item: MergedItem }) => {
  const t = useTranslations('home')
  const url = getItemUrl(item)

  return (
    <Link className="block" href={url}>
      <div className="mb-5 cursor-pointer rounded border border-[rgba(200,180,160,0.1)] bg-white/40 p-5 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-neutral-2 dark:bg-white/5">
        <div className="mb-1.5 text-xs text-neutral-6">
          {item.type === 'post' ? t('second_post') : t('second_note')}
          {' · '}
          <RelativeTime date={item.created} />
          {item.type === 'note' &&
            'weather' in item &&
            (item as any).weather && (
              <>
                {' · '}
                {(item as any).weather}
              </>
            )}
        </div>
        <div className="mb-2 font-serif text-base leading-[1.4] tracking-[0.5px] text-neutral-8">
          {item.title}
        </div>
        {'summary' in item && (item as any).summary && (
          <div className="text-xs leading-[1.8] text-neutral-7">
            {(item as any).summary}
          </div>
        )}
      </div>
    </Link>
  )
}

const PostRow = ({ item }: { item: MergedItem }) => {
  const t = useTranslations('home')
  const url = getItemUrl(item)

  return (
    <div className="mb-3 border-b border-[rgba(200,180,160,0.1)] pb-3 last:mb-0 last:border-0 last:pb-0 dark:border-neutral-2">
      <Link className="flex items-baseline justify-between" href={url}>
        <span className="text-base text-neutral-8 transition-colors duration-300 hover:text-accent">
          {item.title}
        </span>
        <span className="ml-5 whitespace-nowrap text-xs italic text-neutral-6">
          <RelativeTime date={item.created} />
        </span>
      </Link>
      <div className="mt-0.5 text-xs text-neutral-6">
        {item.type === 'note' ? (
          t('second_note')
        ) : (
          <>
            {t('second_post')}
            {item.category?.name && ` · ${item.category.name}`}
          </>
        )}
      </div>
    </div>
  )
}

export const RecentWriting = () => {
  const t = useTranslations('home')
  const { notes, posts } = useHomeQueryData()

  const items = useMemo(() => {
    const merged: MergedItem[] = [
      ...posts.map((p) => ({ ...p, type: 'post' as const })),
      ...notes.map((n) => ({ ...n, type: 'note' as const })),
    ].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    )
    return merged.slice(0, 5)
  }, [notes, posts])

  if (!items.length) return null

  const [featured, ...rest] = items

  return (
    <div>
      <SectionHeading>{t('second_recent_writing')}</SectionHeading>
      <FeaturedPost item={featured} />
      {rest.map((item) => (
        <PostRow item={item} key={item.id} />
      ))}
    </div>
  )
}
