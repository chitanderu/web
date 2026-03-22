import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { NormalContainer } from '~/components/layout/container/Normal'
import { PostTagsFAB } from '~/components/modules/post/fab/PostTagsFAB'
import { PostFeaturedCard } from '~/components/modules/post/PostFeaturedCard'
import { PostListItem } from '~/components/modules/post/PostListItem'
import { PostPagination } from '~/components/modules/post/PostPagination'
import { PostSortBar } from '~/components/modules/post/PostSortBar'
import { NothingFound } from '~/components/modules/shared/NothingFound'
import { SearchFAB } from '~/components/modules/shared/SearchFAB'
import { BackToTopFAB } from '~/components/ui/fab'
import { OnlyDesktop } from '~/components/ui/viewport'
import { apiClient } from '~/lib/request'
import { definePrerenderPage } from '~/lib/request.server'

import { PostListDataRevaildate } from './data-revalidate'

interface Props extends LocaleParams {
  lang?: string
  orderBy?: string
  page?: string
  size?: string
  sortBy?: string
}

export const generateMetadata = async (
  props: NextPageParams<{ locale: string }>,
): Promise<Metadata> => {
  const { locale } = await props.params
  const t = await getTranslations({
    namespace: 'common',
    locale,
  })

  return {
    title: t('page_title_posts'),
  }
}

export default definePrerenderPage<Props>()({
  fetcher: async (params) => {
    const { page, size, orderBy, sortBy, lang, locale } = params || {}
    const currentPage = page ? Number.parseInt(page) : 1
    const currentSize = size ? Number.parseInt(size) : 10

    const preferredLang = lang === 'original' ? undefined : lang || locale

    return await apiClient.post.getList(currentPage, currentSize, {
      sortBy: sortBy as any,
      sortOrder: orderBy === 'desc' ? -1 : 1,
      truncate: 150,
      lang: preferredLang,
    })
  },
  Component: async (props) => {
    const { params, fetchedAt } = props
    const { data, pagination } = props.data
    const { page, sortBy, orderBy, locale } = params

    const t = await getTranslations({ namespace: 'common', locale })
    const currentPage = page ? Number.parseInt(page) : 1

    if (!data?.length) {
      return <NothingFound />
    }

    const isFirstPage = currentPage === 1
    let featuredPost = null
    let listItems = data

    if (isFirstPage) {
      const pinnedIndex = data.findIndex((item) => item.pin)
      if (pinnedIndex !== -1) {
        featuredPost = data[pinnedIndex]
        listItems = data.filter((_, i) => i !== pinnedIndex)
      }
    }

    const sortParams = new URLSearchParams()
    if (sortBy) sortParams.set('sortBy', sortBy)
    if (orderBy) sortParams.set('orderBy', orderBy)

    return (
      <NormalContainer>
        <PostListDataRevaildate fetchedAt={fetchedAt} />

        <div>
          <div className="text-[11px] uppercase tracking-[4px] text-neutral-4">
            Blog
          </div>
          <h1 className="mt-2.5 text-[28px] font-normal text-neutral-9">
            {t('posts_heading')}
          </h1>
        </div>

        {featuredPost && <PostFeaturedCard data={featuredPost} />}

        <PostSortBar totalCount={pagination.total} />

        <div data-fetch-at={fetchedAt}>
          {listItems.map((item) => (
            <PostListItem data={item} key={item.id} />
          ))}
        </div>

        <PostPagination
          pagination={pagination}
          sortParams={sortParams.toString()}
        />

        <PostTagsFAB />
        <SearchFAB />
        <OnlyDesktop>
          <BackToTopFAB />
        </OnlyDesktop>
      </NormalContainer>
    )
  },
})
