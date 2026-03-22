'use client'

import type { NoteTopicListItem, PaginateResult } from '@mx-space/api-client'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { LoadMoreIndicator } from '~/components/modules/shared/LoadMoreIndicator'
import { TimelineList } from '~/components/ui/list/TimelineList'
import { TimelineListItem } from '~/components/ui/list/TimelineListItem'
import { TimelineSpineLayout } from '~/components/ui/list/TimelineSpineLayout'
import { Loading } from '~/components/ui/loading'
import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'
import { getNoteRouteParams } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { getTopicQuery } from './query'

export default function Page() {
  const { slug } = useParams()
  const locale = useLocale()
  const t = useTranslations('note')
  const { data } = useQuery({
    ...getTopicQuery(slug as string, locale),
    enabled: false,
  })

  const {
    data: notes,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['topicId', data?.id, locale],

    enabled: !!data,
    queryFn: async ({ queryKey, pageParam }) => {
      const [, topicId, lang] = queryKey
      if (!topicId) throw new Error('topicId is not ready :(')
      return await apiClient.note.proxy
        .topics(topicId)
        .get<PaginateResult<NoteTopicListItem>>({
          params: {
            page: pageParam,
            lang,
          },
        })
    },
    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
  })
  if (!data) throw new Error('topic data is lost :(')
  const { name } = data

  if (isLoading) return <Loading useDefaultLoadingText />
  return (
    <BottomToUpSoftScaleTransitionView>
      <TimelineSpineLayout title={t('topic_header', { name })}>
        <TimelineList>
          {notes?.pages.map((page) =>
            page.data.map((child) => (
              <TimelineListItem
                date={new Date(child.created)}
                key={child.id}
                label={child.title}
                href={routeBuilder(Routes.Note, {
                  ...getNoteRouteParams(child),
                })}
              />
            )),
          )}

          {hasNextPage && <LoadMoreIndicator onLoading={fetchNextPage} />}
        </TimelineList>
      </TimelineSpineLayout>
    </BottomToUpSoftScaleTransitionView>
  )
}
