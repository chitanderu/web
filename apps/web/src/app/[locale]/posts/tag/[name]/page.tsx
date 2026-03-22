import { getTranslations } from 'next-intl/server'

import { NormalContainer } from '~/components/layout/container/Normal'
import { TimelineList } from '~/components/ui/list/TimelineList'
import { TimelineListItem } from '~/components/ui/list/TimelineListItem'
import { TimelineSpineLayout } from '~/components/ui/list/TimelineSpineLayout'
import { apiClient } from '~/lib/request'
import { definePrerenderPage } from '~/lib/request.server'
import { routeBuilder, Routes } from '~/lib/route-builder'

export default definePrerenderPage<{
  name: string
  locale: string
}>()({
  async fetcher({ name }) {
    const res = await apiClient.category.getTagByName(name)
    return res.data
  },
  async Component({ data, params: { name, locale } }) {
    const t = await getTranslations({
      namespace: 'post',
      locale,
    })
    return (
      <NormalContainer>
        <TimelineSpineLayout
          title={t('tag_title', { name, count: data.length })}
        >
          <TimelineList>
            {data
              .sort(
                (a, b) =>
                  new Date(b.created).getTime() - new Date(a.created).getTime(),
              )
              .map((item) => (
                <TimelineListItem
                  date={new Date(item.created)}
                  id={item.id}
                  key={item.id}
                  label={item.title}
                  href={routeBuilder(Routes.Post, {
                    category: item.category.slug,
                    slug: item.slug,
                  })}
                />
              ))}
          </TimelineList>
        </TimelineSpineLayout>
      </NormalContainer>
    )
  },
})
