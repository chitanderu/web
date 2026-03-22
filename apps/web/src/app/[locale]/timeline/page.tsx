'use client'

import type { TimelineData } from '@mx-space/api-client'
import { TimelineType } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { NormalContainer } from '~/components/layout/container/Normal'
import { TimelineProgress } from '~/components/modules/timeline/TimelineProgress'
import { BackToTopFAB } from '~/components/ui/fab'
import { TimelineList } from '~/components/ui/list/TimelineList'
import { TimelineListItem } from '~/components/ui/list/TimelineListItem'
import { TimelineYearGroup } from '~/components/ui/list/TimelineYearGroup'
import { useRouter } from '~/i18n/navigation'
import { buildNotePath } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { springScrollToElement } from '~/lib/scroller'

enum ArticleType {
  Post,
  Note,
}
type MapType = {
  title: string
  meta: string[]
  date: Date
  href: string

  type: ArticleType
  id: string
  important?: boolean
}

const useJumpTo = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const jumpToId = new URLSearchParams(location.search).get('selectId')

      if (!jumpToId) return

      const target = document.querySelector(
        `[data-id="${jumpToId}"]`,
      ) as HTMLElement

      if (!target) return

      const $a = target.querySelector('a')

      $a?.classList.add('no-shadow')
      springScrollToElement(target, -500).then(() => {
        target.animate(
          [
            {
              backgroundColor: getComputedStyle(
                document.documentElement,
              ).getPropertyValue('accent-color'),
            },
            {
              backgroundColor: 'transparent',
            },
          ],
          {
            duration: 1500,
            easing: 'ease-in-out',
            fill: 'both',
            iterations: 1,
          },
        ).onfinish = () => $a?.classList.remove('no-shadow')
      })

      // wait for user focus
    }, 100)

    return () => clearTimeout(timer)
  }, [])
}

export default function TimelinePage() {
  const t = useTranslations('home')
  const locale = useLocale()
  const search = useSearchParams()
  const router = useRouter()

  const year = search.get('year')
  const type = search.get('type') as 'post' | 'note'
  const nextType = {
    post: TimelineType.Post,
    note: TimelineType.Note,
  }[type]

  const { data: initialData } = useQuery<TimelineData>({
    queryKey: ['timeline'],
    enabled: false,
  })
  const { data, refetch } = useQuery<TimelineData>({
    queryKey: ['timeline', nextType, year, locale],
    initialData,
    queryFn: async ({ queryKey }) => {
      const [, nextType, year] = queryKey as [string, TimelineType, string]
      return await apiClient.aggregate
        .getTimeline({
          type: nextType,
          year: +(year || 0) || undefined,
        })
        .then((res) => res.data)
    },
  })

  useEffect(() => {
    refetch()
  }, [nextType])

  useJumpTo()

  if (!data) return null

  const memory = search.get('bookmark') || search.get('memory')

  const title = !memory ? t('timeline_page_title') : t('timeline_memory')

  const { posts = [], notes = [] } = data
  const sortedMap = new Map<number, MapType[]>()

  if (!memory) {
    posts.forEach((post) => {
      const date = new Date(post.created)
      const year = date.getFullYear()
      const data: MapType = {
        title: post.title,
        meta: [post.category.name, t('timeline_post')],
        date,
        href: `/posts/${post.category.slug}/${post.slug}`,

        type: ArticleType.Post,
        id: post.id,
      }
      sortedMap.set(
        year,
        sortedMap.get(year) ? sortedMap.get(year)!.concat(data) : [data],
      )
    })
  }

  notes
    .filter((n) => (memory ? n.bookmark : true))
    .forEach((note) => {
      const date = new Date(note.created)
      const year = date.getFullYear()
      const data: MapType = {
        title: note.title,
        meta: [
          note.mood ? t('timeline_mood', { mood: note.mood }) : undefined,
          note.weather
            ? t('timeline_weather', { weather: note.weather })
            : undefined,
          t('timeline_note'),
        ].filter(Boolean) as string[],
        date,
        href: buildNotePath(note),

        type: ArticleType.Note,
        id: note.id,
        important: note.bookmark,
      }

      sortedMap.set(
        year,
        sortedMap.get(year) ? sortedMap.get(year)!.concat(data) : [data],
      )
    })

  sortedMap.forEach((val, key) => {
    sortedMap.set(
      key,
      val.sort((a, b) => b.date.getTime() - a.date.getTime()),
    )
  })

  const sortedArr = Array.from(sortedMap)
  const postCount = sortedArr
    .flat(2)
    .filter((i) => typeof i === 'object').length

  return (
    <NormalContainer>
      <header className="mb-12">
        <div className="mb-3">
          <span className="text-[13px] tracking-widest text-neutral-10/50 uppercase">
            {title}
          </span>
        </div>

        <div className="mb-6 flex items-baseline gap-4">
          <span className="text-[4.5rem] leading-none font-extralight tracking-tighter text-neutral-10/50">
            {postCount}
          </span>
          <span className="text-base text-neutral-10/70">
            {t('timeline_posts')}
            {!memory ? t('timeline_keep_going') : t('timeline_look_back')}
          </span>
        </div>

        {!memory && (
          <>
            <TimelineProgress />
            <p className="mt-4 text-[13px] text-neutral-10/50">
              {t('timeline_live_present')}
            </p>
          </>
        )}
      </header>

      <main className="shiro-timeline-spine text-neutral-10/90" key={type}>
        {sortedArr.reverse().map(([year, value]) => (
          <TimelineYearGroup count={value.length} key={year} year={year}>
            <TimelineList>
              {value.map((item) => (
                <TimelineListItem
                  peek
                  date={item.date}
                  dateFormat="MM-DD"
                  href={item.href}
                  id={item.id}
                  important={item.important}
                  key={item.id}
                  label={item.title}
                  meta={item.meta}
                  onBookmarkClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set('memory', 'true')
                    router.push(url.href)
                  }}
                />
              ))}
            </TimelineList>
          </TimelineYearGroup>
        ))}
      </main>
      <BackToTopFAB />
    </NormalContainer>
  )
}
