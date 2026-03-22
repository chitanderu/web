import { dehydrate } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { QueryHydrate } from '~/components/common/QueryHydrate'
import { NormalContainer } from '~/components/layout/container/Normal'
import { attachServerFetch } from '~/lib/attach-fetch'
import { isShallowEqualArray } from '~/lib/lodash'
import { getQueryClient } from '~/lib/query-client.server'
import { definePrerenderPage } from '~/lib/request.server'

import { getTopicQuery } from './query'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (
  props: NextPageParams<{
    slug: string
    locale: string
  }>,
) => {
  await attachServerFetch()
  const queryClient = getQueryClient()
  const { slug, locale } = await props.params

  const query = getTopicQuery(slug, locale)

  const data = await queryClient.fetchQuery(query)
  const t = await getTranslations({
    locale,
    namespace: 'common',
  })

  return {
    title: `${t('page_title_topics')} · ${data.name}`,
  } satisfies Metadata
}

export default definePrerenderPage<{ slug: string; locale: string }>()({
  fetcher: async ({ slug, locale }) => {
    const queryClient = getQueryClient()
    const query = getTopicQuery(slug, locale)

    await queryClient.fetchQuery(query)
  },

  Component: async ({ children, params }) => {
    const queryClient = getQueryClient()
    const query = getTopicQuery(params.slug, params.locale)
    const { queryKey } = query

    return (
      <QueryHydrate
        state={dehydrate(queryClient, {
          shouldDehydrateQuery: (query) =>
            isShallowEqualArray(query.queryKey as any, queryKey),
        })}
      >
        <NormalContainer>{children}</NormalContainer>
      </QueryHydrate>
    )
  },
})
