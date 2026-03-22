'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { stagger, useAnimate } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { LoadMoreIndicator } from '~/components/modules/shared/LoadMoreIndicator'
import { Loading } from '~/components/ui/loading'
import { usePrevious } from '~/hooks/common/use-previous'
import { apiClient } from '~/lib/request'

import { FETCH_SIZE, QUERY_KEY } from './constants'
import { ThinkingItem } from './item'
import { PostBox } from './post-box'

export default function Page() {
  const t = useTranslations('thinking')
  return (
    <div>
      <header className="prose">
        <h1 className="flex items-end gap-2">
          {t('page_title')}
          <a
            aria-hidden
            className="center flex size-8 select-none text-[#EE802F]"
            data-event="Say RSS click"
            href="/thinking/feed"
            rel="noreferrer"
            target="_blank"
          >
            <i className="i-mingcute-rss-fill" />
          </a>
        </h1>
        <h3>{t('page_subtitle')}</h3>
      </header>
      <main className="-mt-12">
        <PostBox />
        <List />
      </main>
    </div>
  )
}

const List = () => {
  const [hasNext, setHasNext] = useState(true)

  const { data, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.shorthand.getList({
        before: pageParam,
        size: FETCH_SIZE,
      })

      if (data.length < FETCH_SIZE) {
        setHasNext(false)
      }
      return data
    },
    enabled: hasNext,
    refetchOnMount: true,

    getNextPageParam: (l) => (l.length > 0 ? l.at(-1)?.id : undefined),
    initialPageParam: undefined as undefined | string,
  })

  const [scope, animate] = useAnimate()

  const getPrevData = usePrevious(data)
  useEffect(() => {
    if (!data) return
    const pages = getPrevData()?.pages
    const count = pages?.reduce((acc, cur) => acc + cur.length, 0)

    animate(
      'li',
      {
        opacity: 1,
        y: 0,
      },
      {
        duration: 0.2,
        delay: stagger(0.1, {
          startDelay: 0.15,
          from: count ? count - FETCH_SIZE : 0,
        }),
      },
    )
  }, [data])

  if (isLoading) <Loading useDefaultLoadingText />

  return (
    <ul ref={scope}>
      {data?.pages.map((page) =>
        page.map((item) => <ThinkingItem item={item} key={item.id} />),
      )}

      {hasNext && (
        <LoadMoreIndicator
          onLoading={() => {
            fetchNextPage()
          }}
        />
      )}
    </ul>
  )
}
